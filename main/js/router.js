"use strict";

const allow_cors = require('cors')();
const get_transactions = require('./glue/get-transactions');
const is_signature_valid = require('./glue/is-signature-valid');
const express = require('express')
const router = express.Router();
const swagger = require('./lib/swagger.js');
const basicAuthHandler = require('./lib/basic-auth-handler.js').get();

const debug = require('./lib/log.js').debug_fn("router");

router.use(allow_cors);

/**
 * API spec handler: swagger.json
 */
router.get('/swagger.json', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger.render());
});

// basic authentication handler
if (basicAuthHandler) router.use(basicAuthHandler);

/**
 *  @swagger
 * /get-transactions/{from-address}/{to-address}:
 *    get:
 *      summary: Retrieve remuneration transactions and/or their tally.
 *      description: |
 *        Retrieve the latest remuneration transactions (and/or their tally) from *from-address* to *to-address*
 *      tags:
 *        - remuneration provider
 *      parameters:
 *        - in: path
 *          name: from-address
 *          required: true
 *          description: |
 *            A public address from which to verify payment details (amount/date) to the *to-address*.  A 42 character 
 *            'hex' string prefixed with '0x'.
 *          type: string
 *        - in: path
 *          name: to-address
 *          required: true
 *          description: |
 *            The target public address to check for payment made.  A 42 character 'hex' string prefixed with '0x'.
 *          type: string
 *        - in: query
 *          name: max-most-recent
 *          required: false
 *          type: integer
 *          description: |
 *            Number of most recent transactions to retrieve.
 *        - in: query
 *          name: since
 *          required: false
 *          type: string
 *          description: |
 *            Retrieve transactions since this date-time (inclusive) until now.
 *
 *            The date-time is a string in [ISO 8601/RFC3339 format](https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14).
 *        - in: query
 *          name: tally-only
 *          required: false
 *          type: boolean
 *          description: |
 *            If present and set to `true` then the 200/OK response will not list individual *transactions*, just the
 *            *tally*.
 *
 *            If not present or set to anything but `true` then the 200/OK response will list individual *transactions* in
 *            addition to the *tally*.  
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: |
 *            List of transactions and/or tally.
 *          schema:
 *            type: object
 *            required:
 *              - tally
 *            properties:
 *              tally:
 *                type: number
 *                description: |
 *                  Tally of all the transactions from *from-address* to *to-address* in the range required
 *                  (*since*,*max-most-recent*,or unlimited).
 *              transactions:
 *                type: array
 *                description: |
 *                  All the transactions from *from-address* to *to-address* in the range required
 *                  (*since*,*max-most-recent*,or unlimited).
 *                items:
 *                  $ref: "#/definitions/Transaction"
 *        400:
 *          $ref: "#/responses/400"
 *        401:
 *          $ref: "#/responses/401"
 *        429:
 *          $ref: "#/responses/429"
 */
router.get('/get-transactions/:fromAddress/:toAddress', (req, rsp) => {
    debug('handling get-transactions endpoint');
    (async () => {
        try {
            let result = await get_transactions({
                fromAddress: req.params['fromAddress'],
                toAddress: req.params['toAddress'],
                maxMostRecent: req.query['max-most-recent'],
                since: req.query['since'],
                tallyOnly: /t/.test(req.query['tally-only'])
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

/**
 * @swagger
 * /is-signature-valid:
 *   post:
 *     summary: Check signature.
 *     description: |
 *       Check if provided signature corresponds to the provided address, resolved to the provided message.
 *
 *       Check if provided address is a valid address in the ledger abstracted by this API.
 *     tags:
 *       - remuneration provider
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - signature
 *             - message
 *             - address
 *           properties:
 *             signature:
 *               type: string
 *               description: |
 *                 base64 encoded string of *signature* to verify
 *             message:
 *               type: string
 *               description: |
 *                 base64 encoded string of *message* that's signed for the *address*
 *             address:
 *               type: string
 *               description: |
 *                 the address (public key) of signature: a 42 character 'hex' string prefixed with '0x'
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: |
 *           Signature is valid.
 *       400:
 *         $ref: "#/responses/400"
 *       401:
 *         $ref: "#/responses/401"
 *       429:
 *         $ref: "#/responses/429"
 */
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