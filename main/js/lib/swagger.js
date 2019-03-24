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
   * @param {string} basic_auth_enabled - is basic authentication enabled for this API
   * @returns {Swagger} this
   */
  init({ base_url, swagger_endpoints_path, ethereum_network, basic_auth_enabled } = {}) {
    if (base_url == null) throw new Error("BASE_URL must be specified.");
    if (swagger_endpoints_path == null) throw new Error("Swagger endpoints_path must be specified.");
    if (basic_auth_enabled == null) throw new Error("BASIC_AUTH_ENABLED must be specified.");

    this[ctx] = {
      url: base_url,
      path: swagger_endpoints_path,
      network: ethereum_network || "mainnet",
      isAuth: basic_auth_enabled
    };
    return this;
  }

  /**
   * @returns {string} rendered Swagger jsoon
   */
  render() {
    this[checkInit]();
    if (this[ctx].isAuth) {
      var securityDefinitions = `
        security:
          - BasicAuth: []
        securityDefinitions:
          BasicAuth:
            type: basic
      `;
    } else {
      var securityDefinitions = '';
    }

    let yaml = `
      swaggerDefinition: 
        swagger: '2.0'
        host: ${this[ctx].url}
        basePath: /
        info:
          description: |          
            An *overhide* "remuneration provider" API for Ethereum networks.

            These API docs are live: connected to the \`${this[ctx].network}\` Ethereum network.

            > These APIs are available on two networks:
            >
            > * [mainnet](https://ethereum.overhide.io/swagger.html)
            > * [rinkeby](https://rinkeby.ethereum.overhide.io/swagger.html)

            GitHub repository for this *overhide-ethereum* service: https://github.com/overhide/overhide-ethereum

            Motivation for this API is written up at https://github.com/overhide/ledgers.js/blob/master/why/why.md.

            An example show case leveraging this API is at https://github.com/overhide/ledgers.js.
          version: 1.0.0
          title: overhide-ethereum API
          contact:
            email: info@overhide.io
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
${securityDefinitions}
      apis: 
        - ${this[ctx].path}
    `;
    return swaggerJSDoc(jsyaml.safeLoad(yaml));
  }

}

module.exports = (new Swagger());