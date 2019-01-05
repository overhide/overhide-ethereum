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
   * @param {string} swagger_urn - URI at which Swagger docs are being served
   * @param {string} swagger_endpoints_path - path to file with annotated endpoints for more API definitions
   * @returns {Swagger} this
   */
  init({ swagger_urn, swagger_endpoints_path } = {}) {
    if (swagger_urn == null) throw new Error("SWAGGER_URN must be specified.");
    if (swagger_endpoints_path == null) throw new Error("Swagger endpoints_path must be specified.");

    this[ctx] = {
      urn: swagger_urn,
      path: swagger_endpoints_path
    };
    return this;
  }

  /**
   * @param {number} num - length of string
   * @returns {string<utf-8>} with random characters
   */
  render() {
    this[checkInit]();
    return swaggerJSDoc(jsyaml.safeLoad(`
    swaggerDefinition: 
      info: 
        title: overhide-ethereum
        version: 1
        description: overhide-ethereum API
      host: ${this[ctx].urn}
      basePath: '/'
    apis: 
      - ${this[ctx].path}
  `));
  }

}

module.exports = (new Swagger());