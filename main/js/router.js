"use strict";

const auth = require('basic-auth');
const ctx = require('./context.js').get();
const get_transactions = require('./glue/get-transactions');
const is_signature_valid = require('./glue/is-signature-valid');
const express = require('express')
const router = express.Router();
const shajs = require('sha.js')

const log = ctx.logger.child({where:"router"});

// basic authentication handler
router.use(function(request, response, next){
    var user = auth(request);
    log.debug({method: request.method, headers:request.headers, path:request.path}, 'request made');
    if (!user) {
        log.debug('invalid basic-auth header');
        // no basic-auth header or malformed
        response.set('WWW-Authenticate', 'Basic');
        return response.status(401).send();  
    }
    ctx.keyv_4_auth.get(user.name)
        .then((passwordHash) => {
            // found key-value for auth
            if (shajs("sha256").update(user.pass).digest("hex") !== passwordHash) {
                // bad password
                log.debug('bad password for user: ' + user);
                response.set('WWW-Authenticate', 'Basic');
                return response.status(401).send();                          
            }
            next(); // all good
        })
        .catch((e) => {
            // didn't find key-value
            log.debug('no such user: '+ user +' ('+e+')');
            response.set('WWW-Authenticate', 'Basic');
            return response.status(401).send();      
        });
});

// Parse JSON body
router.use(express.json());

router.get('/get-transactions/:fromAddress/:toAddress', (req, rsp) => {
    log.debug('handling get-transactions endpoint');
    (async () => {
        try {
            let result = await get_transactions({
                fromAddress: req.params['fromAddress'],
                toAddress: req.params['toAddress']
            });
            log.debug({result:result}, 'result from get-transactions endpoint');
            rsp.json(result);        
        } 
        catch (err) {
            log.debug('error: ' + err);
            return rsp.status(400).send(err);      
        }
    })();
})

router.post('/is-signature-valid', (req, rsp) => {
    log.debug('handling is-signature-valid endpoint');
    (async () => {
        try {
            var body = req.body;
            let result = await is_signature_valid({
                signature: body['signature'],
                message: body['message'],
                address: body['address']
            });
            log.debug({result:result}, 'result from is-signature-valid endpoint');
            rsp.json(result);        
        } 
        catch (err) {
            log.debug('error: ' + err);
            return rsp.status(400).send(err);      
        }
    })();
})

module.exports = router;