"use strict";

const crypto = require('crypto')

const ENCODING = 'utf-8';
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
   * @returns {Crypto} this
   */
  init() {
    this[ctx] = {};
    return this;
  }

  /**
   * @param {number} num - length of string
   * @returns {string<utf-8>} with random characters
   */
  randomChars(num) {
    return crypto.randomBytes(num).toString(ENCODING)    
  }

  /**
   * @param {(string<utf-8>|Buffer|TypedArray)} what - to hash
   * @param {(string<utf-8>|Buffer|TypedArray)} salt - to hash with (optional)
   * @returns {string} hashed what
   */
  hash(what, salt) {
    this[checkInit]();
    if (salt) return crypto.createHmac(HASH_ALGO, salt).update(what, ENCODING).digest(DIGEST_FORMAT);
    else return crypto.createHash(HASH_ALGO).update(what, ENCODING).digest(DIGEST_FORMAT);
  }

}

module.exports = (new Crypto());