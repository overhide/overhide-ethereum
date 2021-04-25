"use strict";

const debug = require('./log.js').debug_fn("token");
const crypto = require('./crypto.js');
const fetch = require('node-fetch');

// private attribtues
const ctx = Symbol('context');

// private functions
const checkInit = Symbol('checkInit');
const failToken = Symbol('failToken');

/**
 * Wires up functionality we use throughout.
 * 
 * Module returns this class as object all wired-up.  Before you can use the methods you must "init" the object 
 * somewhere at process start.
 * 
 * Leverages node's module system for a sort of context & dependency injection, so order of requiring and initializing
 * these sorts of libraries matters.
 */
class Token {
  constructor() {
    this[ctx] = null;
  }

  // ensure this is initialized
  [checkInit]() {
    if (! this[ctx]) throw new Error('library not initialized, call "init" when wiring up app first');
  }

  // Token failure handler -- should be last method call in handler before returning out of middleware.
  //
  // @param {} reason for token failure
  // @param {} res -- response object, set status here
  // @param {} next -- next middleware call trigger
  [failToken](reason, res, next) {   
    debug(`token invalid: %s`, reason);
    // deprecation: noop for now, as the API used to not require tokens, but soon this will be a 401.  Uncomment below when ready.
    // res.status(401).send("unauthorized token");
    // return;
    next(); // don't enforce yet
  }

  /**
   * Initialize this library: this must be the first method called somewhere from where you're doing context & dependency
   * injection.
   * 
   * @param {string} salt - salt for token decryption: if provided, tokenUrl is ignored.
   * @param {string} tokenUrl - URL for validating tokens: not used if salt is provided.
   * @param {bool} isTest - is this instance a test instance?
   * @param {string} internalToken - if any, to bypass token + throttle
   * @returns {Token} this
   */
  init({salt, tokenUrl, isTest, internalToken} = {}) {
    if (salt == null && tokenUrl == null) throw new Error("Either SALT or TOKEN_URL must be specified.");

    this[ctx] = {
      salt: salt,
      tokenUrl, tokenUrl,
      isTest: isTest,
      internalToken: internalToken
    };
    return this;
  }

  /**
   * Check token for validity.
   * tokenUrl, 
   * @param {}  req
   * @param {} res
   * @param {} next
   * @returns {} response or calls next() to continue chain
   */
  async check(req, res, next) {
    this[checkInit]();
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      this[failToken](`no auth header`, res, next);
      return;
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length < 2) {
      this[failToken](`missing token part`, res, next);
      return false;
    }
    var token = tokenParts[1];
    if (!token || typeof token !== 'string') {
      this[failToken](`non-string token part`, res, next);
      return false;
    }

    if (token == this[ctx].internalToken) {
      res.locals.internal = true;
      isValid = true;
    } else if (this[ctx].salt) {
      var [isValid, reason] = this.isValidLocal(token);
    } else {
      var [isValid, reason] = await this.isValidRemote(token);
    }

    if (isValid) {
      next();
    } else {
      this[failToken](reason, res, next);
    }
  }

  /**
   * Check remotely for token validity.
   * @param {*} token -- to check
   * @returns {[bool,string]} whether token is valid + reason string
   */
  async isValidRemote(token) {
    this[checkInit]();
    try {
      const url = `${this[ctx].tokenUrl}?token=${token}&istest=${this[ctx].isTest}`;
      let response = await fetch(url, {
        method: 'GET', headers: {
          'Content-Type': 'text/plain',
          'Accept': 'text/plain'
        }
      });
      if (response.status != 200) {
        let text = await response.text();
        return [false, `token validation failed GET ${url} code: ${response.status} error: ${text}`];
      }
      debug('token valid GET %s: OK', url);
      return [true, ''];
    } catch (err) {
      return [false, `token validation exception (GET ${url}): ${err.toString()}`];
    }
  }

  /**
   * Check locally against a configured SALT for token valdity (no remote call).
   * @param {*} token -- to check
   * @returns {bool} wheher token is valid
   */
  isValidLocal(token)  {
    try {
      token = decodeURIComponent(token);
      token = new Buffer(token, 'base64');  
      token = crypto.symmetricDecrypt(token, this[ctx].salt);
      token = JSON.parse(token);
      var apikey = token['apikey'];
      if (this[ctx].isTest !== token['istest']) {
        return [false, `evironment mismatch (test token:${token['istest']})(test environment:${this[ctx].isTest})`];
      }
      if ((((new Date()) - Date.parse(token['created'])) / 1000) > token['token_validity_seconds']) {
        return [false, `token expired`];
      }
    }
    catch (err) {
      return [false, `bad token`];
    }

    debug(`token valid (apikey:%s)`, apikey);
    return [true, ''];
  }
}

module.exports = (new Token());