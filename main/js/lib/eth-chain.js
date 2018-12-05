"use strict";

const esApi = require('etherscan-api')
const ethCrypto = require('eth-crypto');

// private attribtues
const ctx = Symbol('context');
const metrics = Symbol('metrics');

// private functions
const checkInit = Symbol('checkInit');
const checkHasEtherscan = Symbol('checkHasEtherscan');

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

  [checkHasEtherscan]() {
    this[checkInit]();
    if (! this[ctx].api) throw new Error('ETHERSCAN_KEY must be specified: see README.md#Configuration.  Etherscan API not initialized, call "init" with ETHERSCAN_KEY/TYPE');
  }

  /**
   * Initialize this library: this must be the first method called somewhere from where you're doing context & dependency
   * injection.
   * 
   * @param {string} etherscan_key - key for etherscan.io API access
   * @param {string} etherscan_type - type of network for etherscan.io access ("","ropsten","rinkeby","morden")
   * @return {EthChain} this
   */
  init({etherscan_key = null, etherscan_type = null} = {}) {
    var api = null;
    if (etherscan_key && etherscan_type) {
      var api = esApi.init(etherscan_key, etherscan_type);
    } else if (etherscan_key) {
      var api = esApi.init(etherscan_key);
    }

    this[ctx] = {
      api: api
    };
    this[metrics] = {
      txlistForAddressHits: 0
    };

    return this;
  }

  /**
   * @param {string} address - an Ethereum network address ('0x...')

   * @returns {Promise<Object[]>} an array of transactions: [{from:..,to:..,value:..,timeStamp},..] where 'from' is the payee 
   *   address, 'to' is the recepient, 'value' is the amount of Wei, and 'timeStamp' is the transaction write unix time 
   *   in seconds.
   * 
   * @throws {Error} if problem
   */
  async getTransactionsForAddress(address) {
    this[checkHasEtherscan]();
    var txs = await this[ctx].api.account.txlist(address);
    if (txs.status != 1) throw new Error(txs.message);
    this[metrics].txlistForAddressHits++;
    return txs.result;
  }

  /**
   * @returns {Object} a new identity with newly generated key strings: {privateKey:..,address:..}
   */
  createIdentity() {
    this[checkInit]();
    return ethCrypto.createIdentity();
  }

  /**
   * @param {(string|Buffer|TypedArray)} payload - to hash
   * @returns {string} the hash ('0x..')
   */
  keccak256(payload) {
    this[checkInit]();
    return ethCrypto.hash.keccak256(payload);
  }

  /**
   * @param {string} key - for signing ('0x..')
   * @param {string} message - to be signed (usually hash of payload)
   * @returns {string} signed payload
   */
  sign(key, message) {
    this[checkInit]();
    return ethCrypto.sign(key, message);
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
    var target = ethCrypto.recover(signature, message).toLowerCase();
    return (address == target);
  }

  /**
   * @returns {{txlistForAddressHits:..}} metrics object.
   */
  metrics() {
    this[checkInit]();
    return this[metrics];
  }
}

module.exports = (new EthChain());