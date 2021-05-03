"use strict";

const Web3 = require('web3')
const web3 = new (Web3)();
const crypto = require('crypto')
const log = require('./log.js').fn("eth-chain");


const ENCODING = 'utf-8';
const HASH_ALGO = 'sha256';
const DIGEST_FORMAT = 'hex';

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
class EthChain {
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
   * @param {string} web3_uri - URI to web3 websocket provider
   * @param {string} ethereum_network - type of network for etherscan.io access ("mainnet","ropsten","rinkeby","morden")
   * @return {EthChain} this
   */
  init({web3_uri, ethereum_network} = {}) {
    if (web3_uri == null) throw new Error("WEB3_URI must be specified.");
    if (ethereum_network == null) throw new Error("NETWORK_TYPE must be specified.");

    if (web3_uri != 'fake') {
      if (/https/.test(web3_uri)) {
        var web3 = new Web3(new Web3.providers.HttpProvider(web3_uri));
      } else {
        var web3 = new Web3(new Web3.providers.WebsocketProvider(web3_uri));
      }
    } else {
      log(`fake infura project, skipping init...`);
    }

    this[ctx] = {
      web3_uri: web3_uri,
      ethereum_network: ethereum_network,
      web3: web3
    };
    this[metrics] = {
      errors: 0,
      errorsLastCheck: 0,
      errorsDelta: 0
    };

    return this;
  }

  /**
   * @param {number} index -- block index
   * @returns {number} latest block number.
   */
  async getLatestBlock() {
    this[checkInit]();
    try {
      const result = await this[ctx].web3.eth.getBlockNumber();
      return result;  
    } catch (err) {
      this[metrics].errors++;
      throw err;
    }
  }

  /**
   * @param {number} index -- block index
   * @returns {[{block:.., from:.., to:.., time:.., value:.., bkhash:.., txhash:.., parentHash:..},..]} transactions with values in wei.  If block has only 0-valued
   *   transactions then only a single transaction is returned with `to` and `from` set to `null`, and `value` to `0`.
   */
  async getTransactionsForBlock(index) {
    this[checkInit]();
    try {
      const result = await this[ctx].web3.eth.getBlock(index, true);
      if (!result) throw `error retrieving block ${index}`;
      const block = result.number;
      const hash = result.hash;
      const parentHash = result.parentHash;
      const time = new Date(result.timestamp * 1000);
      const filtered = (result.transactions || []).filter(t => t.value > 0);
      if (filtered.length == 0) {
        return [{
          block: block,
          from: null,
          to: null,
          time: time,
          value: 0,
          bkhash: hash,
          txhash: hash, /* use block hash, doesn't matter, just a palce holder value */
          parentHash: parentHash
        }];
      }
      return filtered
        .map(t => {
        return {
          block: block,
          from: t.from,
          to: t.to,
          time: time,
          value: t.value,
          bkhash: hash,
          txhash: t.hash,
          parentHash: parentHash
        }
      });  
    } catch (err) {
      this[metrics].errors++;
      throw err;
    }
  }

  /**
   * @returns {Object} a new identity with newly generated key strings: {privateKey:..,address:..}
   */
  createIdentity() {
    this[checkInit]();
    return web3.eth.accounts.create();
  }

  /**
   * @param {(string|Buffer|TypedArray)} payload - to hash
   * @returns {string} the hash ('0x..')
   */
  keccak256(payload) {
    this[checkInit]();
    return crypto.createHash(HASH_ALGO).update(payload, ENCODING).digest(DIGEST_FORMAT);
  }

  /**
   * @param {string} key - for signing ('0x..')
   * @param {string} message - to be signed (usually hash of payload)
   * @returns {string} signed payload
   */
  sign(key, message) {
    this[checkInit]();
    return web3.eth.accounts.sign(message, key).signature;
  }

  /**
   * 
   * @param {string} address - of the public address corresponding to private key of signature
   * @param {string} signature - the signature ('0x..')
   * @param {string} message - that was signed (usually hash of payload)
   * @returns {boolean} if signature checks out
   */
  isSignatureValid(address, signature, message) {
    this[checkInit]();
    var target = web3.eth.accounts.recover(message, signature).toLowerCase();
    return (address == target);
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

module.exports = (new EthChain());