"use strict";

const BasicAuth = require('basic-auth');
const auth = require('./lib/auth.js');
const eth = require('./lib/eth-chain.js');
const get_transactions = require('./glue/get-transactions');
const is_signature_valid = require('./glue/is-signature-valid');
const express = require('express')
const router = express.Router();

const log = require('./lib/log.js').fn("router");
const debug = require('./lib/log.js').debug_fn("router");

// basic authentication handler
router.use(function(request, response, next){
    var user = BasicAuth(request);
    debug('request made (method:%s)(headers:%s)(path:%s)', request.method, request.headers, request.path);
    if (!user) {
        debug('invalid basic-auth header');
        // no basic-auth header or malformed
        response.set('WWW-Authenticate', 'Basic');
        return response.status(401).send();  
    }
    auth.isAuthValid(user.name, user.pass)
        .then((valid) => {
            if (!valid) {
                debug('authentication invalid for user: %s', user);
                response.set('WWW-Authenticate', 'Basic');
                return response.status(401).send();                          
            }
            next(); // all good
        })
        .catch((e) => {
            // didn't find key-value
            debug('error authenticating user: %s (%o)', user, e);
            response.set('WWW-Authenticate', 'Basic');
            return response.status(401).send();      
        });
});

router.get('/get-transactions/:fromAddress/:toAddress', (req, rsp) => {
    debug('handling get-transactions endpoint');
    (async () => {
        try {
            let result = await get_transactions({
                fromAddress: req.params['fromAddress'],
                toAddress: req.params['toAddress'],
                maxMostRecent: req.query['max-most-recent'],
                since: req.query['since'],
                tallyOnly: req.query['tally-only']
            });
            debug('result from get-transactions endpoint: %o', result);
            rsp.json(result);        
        } 
        catch (err) {
            debug(err);
            return rsp.status(400).send(err);      
        }
    })();
})

router.post('/is-signature-valid', (req, rsp) => {
    debug('handling is-signature-valid endpoint');
    (async () => {
        try {
            var body = req.body;
            let result = await is_signature_valid({
                signature: body['signature'],
                message: body['message'],
                address: body['address']
            });
            debug('result from is-signature-valid endpoint: %o',result);
            rsp.json(result);        
        } 
        catch (err) {
            debug(err);
            return rsp.status(400).send(err);      
        }
    })();
})

// Health Check
//
// Set '/status.html' as 'ping path' for your load balancer.
router.get('/status.html', (req, rsp) => {
	var healthy = true;
	if (healthy) {
		rsp.status(200);
	} else {
		rsp.status(500);
	}
	var metrics = {
        eth: eth.metrics(),
        auth: auth.metrics()
	}
	rsp.render('health.html',{status: 'healthy', metrics: JSON.stringify(metrics,null,2)}); 
})

router.get('/status.json', (req, rsp) => {
	var healthy = true;
	if (healthy) {
		rsp.status(200);
	} else {
		rsp.status(500);
	}
	rsp.json({
		healthy: healthy ? true : false,
		metrics: {
            eth: eth.metrics(),
            auth: auth.metrics()
		}
	});
})

module.exports = router;