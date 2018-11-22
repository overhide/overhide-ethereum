"use strict";

const Keyv = require('keyv');

// private attribtues
const ctx = Symbol('context');

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
class Keyv4Auth {
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
   * @param keyv_uri is 'keyv' adapter uri for key-value abstraction 'keyv'
   * @param keyv_auth_namespace is namespace to use in 'keyv' data store for authenticating
   * @return this
   */
  init({keyv_uri, keyv_auth_namespace}) {
    if (keyv_uri == null) throw new Error("KEYV_URI must be specified: see README.md#Configuration.");
    if (keyv_auth_namespace == null) throw new Error("KEYV_AUTH_NAMESPACE must be specified: see README.md#Configuration.")

    this[ctx] = {
      uri: keyv_uri,
      namespace: keyv_auth_namespace
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
   *  @return is an object: the 'keyv' (https://www.npmjs.com/package/keyv) metadata key-value store abstraction for 
   *          authenticated users
   */
  get() {
    this[checkInit]();
    return this[ctx].keyv;
  }
}

module.exports = (new Keyv4Auth());