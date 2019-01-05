"use strict";

const nocors = require('cors')();
const get_transactions = require('./glue/get-transactions');
const is_signature_valid = require('./glue/is-signature-valid');
const express = require('express')
const router = express.Router();
const swagger = require('./lib/swagger.js');
const basicAuthHandler = require('./lib/basic-auth-handler.js').get();

const debug = require('./lib/log.js').debug_fn("router");


// basic authentication handler
if (basicAuthHandler) router.use(basicAuthHandler);

/**
 * API spec handler: swagger.json
 */
router.get('/swagger.json', nocors, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger.render());
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
            return rsp.status(400).send(err.toString());      
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
            return rsp.status(400).send(err.toString());      
        }
    })();
})

module.exports = router;