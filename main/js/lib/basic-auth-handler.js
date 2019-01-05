"use strict";

const BasicAuth = require('basic-auth');
const auth = require('./auth.js');

const log = require('./log.js').fn("basic-auth");
const debug = require('./log.js').debug_fn("basic-auth");

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
class BasicAuthHandler {
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
   * @param {boolean} basic_auth_enabled - is it on?
   * @returns {BasicAuthHandler} this
   */
  init({ basic_auth_enabled } = {}) {
    if (basic_auth_enabled == null) throw new Error("BASIC_AUTH_ENABLED must be specified.");

    this[ctx] = {
      enabled: basic_auth_enabled
    };
    return this;
  }

  /**
   * @returns {Function} handler
   */
  get() {
    this[checkInit]();
    if (!this[ctx].enabled) {
      log('basic-auth disabled');
      return null;
    }
    log('basic-auth enabled');
    return (request, response, next) => {
      var user = BasicAuth(request);
      debug('request made (method:%s)(headers:%o)(path:%s)', request.method, request.headers, request.path);
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
    };
  }

}

module.exports = (new BasicAuthHandler());