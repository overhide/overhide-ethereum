"use strict";

const fetch = require('node-fetch');
const debug = require('./log.js').debug_fn("etherscan");

// private attribtues
const ctx = Symbol('context');
const metrics = Symbol('metrics');

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
class Etherscan {
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
   * @param {string} etherscan_key - key for etherscan.io API access
   * @param {string} ethereum_network - type of network for etherscan.io access ("mainnet","ropsten","rinkeby","morden")
   * @return {Etherscan} this
   */
  init({etherscan_key = null, ethereum_network = null} = {}) {
    if (etherscan_key == null) throw new Error("ETHERSCAN_KEY must be specified.");
    if (ethereum_network == null) throw new Error("NETWORK_TYPE must be specified.");

    this[ctx] = {
      etherscan_key: etherscan_key,
      ethereum_network: ethereum_network
    };

    this[metrics] = {
      errors: 0,
      errorsLastCheck: 0,
      errorsDelta: 0,
      txlistForAddressHits: 0
    };

    return this;
  }

  /**
   * @param {string} address - an Ethereum network address ('0x...')

   * @returns {Promise<Object[]>} an array of transactions: [{block:.., from:..,to:..,value:..,time:.., hash:..},..] where 'from' is the payee 
   *   address, 'to' is the recepient, 'value' is the amount of Wei, and 'timeStamp' is the transaction write unix time 
   *   in seconds.
   * 
   * @throws {Error} if problem
   */
  async getTransactionsForAddress(address) {
    try {
      this[checkInit]();
      const network = this[ctx].ethereum_network == 'mainnet' ? '' :  `-${this[ctx].ethereum_network}`;
  
      let startBlock = 0;
      var txs = []
      for(;;) {
        const url = `https://api${network}.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&sort=asc&apikey=${this[ctx].etherscan_key}`;
        let response = await fetch(url, {
          method: 'GET', headers: {
            'Content-Type': 'text/plain',
            'Accept': 'application/json'
          }
        });
        if (response.status != 200) {
          let text = await response.text();
          throw `etherscan GET   async getTransactionsForAddress(${address}) code: ${response.status} error: ${text}`;
        }
        response = await response.json();
        txs = [...txs,...response.result];
        if (response.result.length < 10000) break;
        debug(`more than 10000 results from etherscan for ${address}, fetching more`);
        startBlock = Math.max(...response.result.map(r => parseInt(r.blockNumber)));      
      }
      
      txs = txs.map(r => {
        return {
          block: r.blockNumber,
          from: r.from,
          to: r.to,
          bkhash: r.blockHash,
          txhash: r.hash,
          value: r.value,
          time: new Date(+r.timeStamp * 1000)
        };
      });
  
      if (!txs) throw new Error(`no result for ${address}`);
      this[metrics].txlistForAddressHits++;
      return txs; 
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

module.exports = (new Etherscan());