"use strict";

const debug = require('./log.js').debug_fn("tally-cache");
const Keyv = require('keyv');

const NAMESPACE = 'eth-tc'; 

// private attribtues
const ctx = Symbol('context');
const metrics = Symbol('metrics');

// private functions
const checkInit = Symbol('checkInit');
const getKeyv = Symbol('getKeyv');
const getKey = Symbol('getKey');

/**
 * Wires up functionality we use throughout.
 * 
 * Module returns this class as object all wired-up.  Before you can use the methods you must "init" the object 
 * somewhere at process start.
 * 
 * Leverages node's module system for a sort of context & dependency injection, so order of requiring and initializing
 * these sorts of libraries matters.
 */
class TallyCache {
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
   * @param {string} keyv_tally_cache_uri - 'keyv' adapter uri for key-value abstraction 'keyv'
   * @returns {TallyCache} this
   */
  init({keyv_tally_cache_uri} = {}) {
    if (keyv_tally_cache_uri == null) throw new Error("Both KEYV_TALLY_CACHE_URI must be specified.");

    this[ctx] = {
      uri: keyv_tally_cache_uri,
      namespace: NAMESPACE
    };

    this[ctx].keyv = this[getKeyv]();

    this[metrics] = {
      errors: 0,
      errorsLastCheck: 0,
      errorsDelta: 0,
      hits: 0,
      misses: 0,
      caches: 0
    };   
    
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

  [getKey](fromAddress, toAddress, maxMostRecent, since, asOf, tallyDollars, includeRefunds, confirmations) {
    return `${fromAddress}, ${toAddress}, ${maxMostRecent}, ${new Date(since).getTime() / 1000}, ${new Date(asOf).getTime() / 1000}, ${tallyDollars}, ${includeRefunds}, ${confirmations}`;
  }

  /**
   * middleware to get value from cache.
   * @param {}  req
   * @param {} res
   * @param {} next
   * @returns {} response or calls next() to continue chain
   */
     async cacheCheck(req, res, next) {
      this[checkInit]();
      const tallyDollars = /t/.test(req.query['tally-dollars']);

      if (!req.query['as-of'] || !(tallyDollars || /t/.test(req.query['tally-only']))) {
        next();
        return;
      }
      
      const key = this[getKey](req.params['fromAddress'], req.params['toAddress'], req.query['max-most-recent'], req.query['since'], req.query['as-of'], tallyDollars, /t/.test(req.query['include-refunds']), req.query['confirmations-required'] ? req.query['confirmations-required'] : 0);
      const val = await this[ctx].keyv.get(key);
      if (val) {
        this[metrics].hits++;
        res.locals.backend = true;
        res.locals.result = val;
      } else {
        this[metrics].misses++;
      }
      next();
    }

  /**
   * middleware to save value to cache...  acts on response.
   * @param {}  req
   * @param {} res
   * @param {} next
   * @returns {} response or calls next() to continue chain
   */
   async cacheSave(req, res, next) {
    this[checkInit]();

    if (res.locals.backend) {
      // already returning cached value
      next();
      return;
    }

    if (!res.locals.result) {
      // no result to cache (error)
      next();
      return;
    }
    
    const tallyDollars = /t/.test(req.query['tally-dollars']);

    if (!(tallyDollars || /t/.test(req.query['tally-only']))) {
      // not cachable
      next();
      return;
    }

    const newAsOf = res.locals.result['as-of'];
    const key = this[getKey](req.params['fromAddress'], req.params['toAddress'], req.query['max-most-recent'], req.query['since'], newAsOf, tallyDollars, /t/.test(req.query['include-refunds']), req.query['confirmations-required'] ? req.query['confirmations-required'] : 0);
    await this[ctx].keyv.set(key, res.locals.result);  
    this[metrics].caches++;
    next();
  }

  /**
   * @returns {{errors:.., errorsDelta:..}} metrics object.
   */
   metrics() {
    this[checkInit]();
    this[metrics].errorsDelta = this[metrics].errors - this[metrics].errorsLastCheck;
    this[metrics].errorsLastCheck = this[metrics].errors;
    return this[metrics];
  }    
}

module.exports = (new TallyCache());