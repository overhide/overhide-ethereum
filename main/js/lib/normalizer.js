"use strict";

const fetch = require('node-fetch');

// private attribtues
const ctx = Symbol('context');

// private functions
const checkInit = Symbol('checkInit');
const metrics = Symbol('metrics');

/**
 * Wires up functionality we use throughout.
 * 
 * Module returns this class as object all wired-up.  Before you can use the methods you must "init" the object 
 * somewhere at process start.
 * 
 * Leverages node's module system for a sort of context & dependency injection, so order of requiring and initializing
 * these sorts of libraries matters.
 */
class Normalizer {
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
   * @param {string} internalToken
   * @param {boolean} isProd
   * @return this
   */
  init({internalToken, isProd}) {
    if (internalToken == null) throw new Error("INTERNAL_TOKEN must be specified.");

    this[ctx] = {
      internalToken: internalToken,
      isProd: isProd
    };
    this[metrics] = {
      errors: 0,
      errorsLastCheck: 0,
      errorsDelta: 0,
      requests: 0
    };    
    return this;
  }

  /**
   * @param {[{transaction-date: Date, transaction-value: string},..]} transactions
   * @returns {number} tally
   */
  async transform(transactions) {
    this[checkInit]();    

    if (!transactions || transactions.length == 0) return 0;
    const values = transactions.map(t => `${t['transaction-value']}@${(new Date(t['transaction-date'])).toISOString()}`);        

    try {
      const hostPrefix = this[ctx].isProd ? '' : 'test.';
      const url = `https://${hostPrefix}rates.overhide.io/tallymax/wei/${values.join(',')}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this[ctx].internalToken}`
        }
      });
      if (response.status != 200) {
        let text = await response.text();
        throw `GET ${url} code: ${response.status} error: ${text}`;
      }
      const tally = await response.text();  
      this[metrics].requests++;
      return (Math.round(tally * 100) / 100).toFixed(2);      
    } catch (err) {
      this[metrics].errors++;
      throw err;
    }    
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

module.exports = (new Normalizer());