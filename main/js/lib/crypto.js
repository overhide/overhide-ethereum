"use strict";

const crypto = require('crypto')

const HASH_ALGO = 'sha256';
const DIGEST_FORMAT = 'hex';

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
class Crypto {
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
   * @return this
   */
  init() {
    this[ctx] = {};
    return this;
  }

  /**
   * @param what to hash
   * @return hashed what
   */
  hash(what) {
    this[checkInit]();
    return crypto.createHash(HASH_ALGO).update(what).digest(DIGEST_FORMAT);
  }

}

module.exports = (new Crypto());