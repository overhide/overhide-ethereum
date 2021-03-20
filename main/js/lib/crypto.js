"use strict";

const crypto = require('crypto')

const ENCODING = 'utf-8';
const HASH_ALGO = 'sha256';
const DIGEST_FORMAT = 'hex';
const SYMMETRIC_ALGO = 'aes-256-cbc';

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

  /**
   * @param {(string<utf-8>|Buffer|TypedArray)} plainblob - to hash
   * @param {string<utf-8>} password
   * @returns {Buffer} cypherblob
   */
  symmetricEncrypt(plainblob, password) {
    this[checkInit]();
    var cypher = crypto.createCipher(SYMMETRIC_ALGO,password);
    return Buffer.concat([cypher.update(plainblob,ENCODING),cypher.final()]);
  }

    /**
   * @param {Buffer} cypherblob - to hash
   * @param {(string<utf-8>|Buffer|TypedArray)} password - to hash with (optional)
   * @returns {Buffer} plainblob
   */
  symmetricDecrypt(cypherblob, password) {
    this[checkInit]();
    var cypher = crypto.createDecipher(SYMMETRIC_ALGO,password);
    return Buffer.concat([cypher.update(cypherblob),cypher.final()]);
  }
}

module.exports = (new Crypto());