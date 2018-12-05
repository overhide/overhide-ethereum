"use strict";

const Keyv = require('keyv');
const crypto = require('./crypto.js');
const debug = require('./log.js').debug_fn("auth");
const log = require('./log.js').fn("auth");

// private attribtues
const ctx = Symbol('context');
const metrics = Symbol('metrics');

// private functions
const checkInit = Symbol('checkInit');
const getKeyv = Symbol('getKeyv');

/**
 * Wires up functionality we use throughout.
 * 
 * Module returns this class as object all wired-up.  Before you can use the methods you must "init" the object 
 * somewhere at process start.
 * 
 * Leverages node's module system for a sort of context & dependency injection, so order of requiring and initializing
 * these sorts of libraries matters.
 */
class Auth {
  constructor() {
    this[ctx] = null;
  }

  // ensure this is initialized
  [checkInit]() {
    if (! this[ctx]) throw new Error('library not initialized, call "init" when wiring up app first');
  }

  /**
   * Initialize this library: this must be the first method called somewhere from where you're doing context & dependency
   * injection.
   * 
   * @param {string} keyv_uri - 'keyv' adapter uri for key-value abstraction 'keyv'
   * @param {string} keyv_auth_namespace - namespace to use in 'keyv' data store for authenticating
   * @returns {Auth} this
   */
  init({keyv_uri, keyv_auth_namespace}) {
    if (!keyv_uri) log("WARNING:  KEYV_URI not be specified--using in-memory store (for testing)");
    if (!keyv_auth_namespace) throw new Error("KEYV_AUTH_NAMESPACE must be specified: see README.md#Configuration.")

    this[ctx] = {
      uri: keyv_uri,
      namespace: keyv_auth_namespace
    };
    this[metrics] = {
      authNamespaceHash: crypto.hash(keyv_auth_namespace)
    };

    this[ctx].keyv = this[getKeyv]();

    return this;
  }

  // @return A 'keyv' datastore instance for authenticated users
  [getKeyv]() {
    return new Keyv({
      uri: typeof this[ctx].uri === 'string' && this[ctx].uri,
      store: typeof this[ctx].uri !== 'string' && this[ctx].uri,
      namespace: this[ctx].namespace
    });
  }

  /**
   * Check user's authentication
   * 
   * @param {string} user - to check
   * @param {string} password - to check
   * @returns {Promise<boolean>} a promise with that's 'true' if password checks out for user
   */
  async isAuthValid(user, password) {
    this[checkInit]();
    var userhash = crypto.hash(user);
    try {
      var entry = await this[ctx].keyv.get(userhash);
      if (entry) {
        var salt = Object.keys(entry)[0];
        var salted = entry[salt];
        if (salted === crypto.hash(password, salt)) {
          return true;
        }
        debug('bad password for user: %s', user);
      }  
    } catch (e) {
      debug('no such user: %s (%o)', user, e);
    }
    return false;
  }

  /**
   * Set user's authentication
   * 
   * @param {string} user - to check
   * @param {string} password - to check
   */
  async updateUser(user, password) {
    this[checkInit]();
    var salt = crypto.randomChars(16);
    var userhash = crypto.hash(user);
    var passhash = crypto.hash(password, salt);
    var value={};
    value[salt]=passhash;
    await this[ctx].keyv.set(userhash,value);
  }

  /**
   * Delete user's authentication
   * 
   * @param {string} user - to delete
   */
  async deleteUser(user) {
    this[checkInit]();
    var userhash = crypto.hash(user);
    await this[ctx].keyv.delete(userhash);
  }

  /**
   * @returns {{authNamespaceHash:..}} metrics object.
   */
  metrics() {
    this[checkInit]();
    return this[metrics];
  }
}

module.exports = (new Auth());