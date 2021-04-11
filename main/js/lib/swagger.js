"use strict";

const path = require('path');
const jsyaml = require('js-yaml');
const swaggerJSDoc = require('swagger-jsdoc');

// private attribtues
const ctx = Symbol('context');

// private functions
const checkInit = Symbol('checkInit');

/**
 * Wires up functionality we use throughout.
 * 
 * Module returns this class as object all wired-up.  Before you can use the methods you must "init" the object 
 * somewhere at process start.
 * 
 * Leverages node's module system for a sort of context & dependency injection, so order of requiring and initializing
 * these sorts of libraries matters.
 */
class Swagger {
  constructor() {
    this[ctx] = null;
  }

  // ensure this is initialized
  [checkInit]() {
    if (!this[ctx]) throw new Error('library not initialized, call "init" when wiring up app first');
  }

  /**
   * Initialize this library: this must be the first method called somewhere from where you're doing context & dependency
   * injection.
   * 
   * @param {string} base_url - URL at which Swagger docs are being served
   * @param {string} swagger_endpoints_path - path to file with annotated endpoints for more API definitions
   * @param {string} ethereum_network - connected to
   * @returns {Swagger} this
   */
  init({ base_url, swagger_endpoints_path, ethereum_network } = {}) {
    if (base_url == null) throw new Error("BASE_URL must be specified.");
    if (swagger_endpoints_path == null) throw new Error("Swagger endpoints_path must be specified.");

    this[ctx] = {
      url: base_url,
      path: swagger_endpoints_path,
      network: ethereum_network || "mainnet"
    };
    return this;
  }

  /**
   * @returns {string} rendered Swagger jsoon
   */
  render() {
    this[checkInit]();

    let yaml = `
      swaggerDefinition: 
        openapi: 3.0.1
        components:
          securitySchemes:
            bearerAuth:
              type: http
              scheme: bearer
              bearerFormat: uses https://token.overhide.io
        security:
          - bearerAuth: uses https://token.overhide.io
        host: ${this[ctx].url}
        basePath: /
        info:
          description: |          
            <hr/>         
            <a href="https://overhide.io" target="_blank">overhide.io</a> is a free and open-sourced (mostly) ecosystem of widgets, a front-end library, and back-end services &mdash; to make addition of "logins" and "in-app-purchases" (IAP) to your app as banal as possible.
            <hr/><br/>

            This is an *overhide* "remuneration provider" API for Ethereum networks.

            These API docs are live: connected to the \`${this[ctx].network}\` Ethereum network.

            > These APIs are available on two networks:
            >
            > * [mainnet](https://ethereum.overhide.io/swagger.html)
            > * [rinkeby](https://rinkeby.ethereum.overhide.io/swagger.html)

            GitHub repository for this *overhide-ethereum* service: [https://github.com/overhide/overhide-ethereum](https://github.com/overhide/overhide-ethereum).

            This API is in support of [ledger-based authorizations](https://overhide.io/2019/03/20/why.html) as per [https://overhide.io](https://overhide.io).

            This API is in support of the [https://github.com/overhide/ledgers.js](https://github.com/overhide/ledgers.js) library.

            These APIs require bearer tokens to be furnished in an 'Authorization' header as 'Bearer ..' values.  The tokens are to be retrieved from
            [https://token.overhide.io](https://token.overhide.io).
          version: 1.0.0
          title: overhide-ethereum API
          contact:
            name: r/overhide (reddit)
            url: https://www.reddit.com/r/overhide/
          externalDocs:
            description: GitHub repository for overhide-ethereum.
            url: 'https://github.com/overhide/overhide-ethereum'
          license:
            name: License
            url: 'https://github.com/overhide/overhide-ethereum/blob/master/LICENSE'
        tags:
          - name: remuneration provider
            description: |
              Implementation of the *overhide* "remuneration provider" APIs for Ethereum networks.
        definitions:
          Transaction:
            type: object
            required:
              - transaction-value
              - transaction-date
            properties:
              transaction-value:
                type: number
                description: |
                  Value of the transaction.
              transaction-date:
                type: string
                description: |
                  Date-time timestamp of the transaction.

                  The date-time is a string in [ISO 8601/RFC3339 format](https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14).
        responses:
          400:
            description: |
              A bad request from the client results in one or more of the following error message strings.

              The message enum might be extended by remuneration provider.
            schema:
              type: array
              items:
                type: string
                enum:
                  - address incompatible
                  - invalid signature
                  - no transactions for address
          401:
            description: Authentication information is missing or invalid
            headers:
              WWW_Authenticate:
                type: string
          429:
            description: |
              Client is calling the API too frequently.

              Conditions for this response to occur are remuneration provider dependant.
      apis: 
        - ${this[ctx].path}
    `;
    return swaggerJSDoc(jsyaml.safeLoad(yaml));
  }

}

module.exports = (new Swagger());