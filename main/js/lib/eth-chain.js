"use strict";

const esApi = require('etherscan-api')
const ethCrypto = require('eth-crypto');

// private attribtues
const ctx = Symbol('context');

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
   * @param etherscan_key is key for etherscan.io API access
   * @param etherscan_type is yype of network for etherscan.io access ("","ropsten","rinkeby","morden")
   * @return this
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
    return this;
  }

  /**
   * @param an Ethereum network address as string ('0x...')

   * @return promise passed an array of transactions: [{from:..,to:..,value:..,timeStamp},..] where 'from' is the payee 
   *   address, 'to' is the recepient, 'value' is the amount of Wei, and 'timeStamp' is the transaction write unix time 
   *   in seconds.
   * 
   * @throws Error if problem
   */
  async getTransactionsForAddress(address) {
    this[checkHasEtherscan]();
    var txs = await this[ctx].api.account.txlist(address);
    if (txs.status != 1) throw new Error(txs.message);
    return txs.result;
  }

  /**
   * @return a new identity with newly generated key strings: {privateKey:..,address:..}
   */
  createIdentity() {
    this[checkInit]();
    return ethCrypto.createIdentity();
  }

  /**
   * @param {payload} to hash into string, could be string, Buffer, ArrayBuffer, Uint8Array
   * @return the hash string ('0x..')
   */
  keccak256(payload) {
    this[checkInit]();
    return ethCrypto.hash.keccak256(payload);
  }

  /**
   * @param {key} string for signing ('0x..')
   * @param {message} string to be signed (usually hash of payload)
   * @return signed payload as string
   */
  sign(key, message) {
    this[checkInit]();
    return ethCrypto.sign(key, message);
  }

  /**
   * 
   * @param {address} string of the public address corresponding to private key of signature
   * @param {signature} the signature string ('0x..')
   * @param {message} string that was signed (usually hash of payload)
   * @return boolean if signature checks out
   */
  isSignatureValid(address, signature, message) {
    this[checkInit]();
    var target = ethCrypto.recover(signature, message).toLowerCase();
    return (address == target);
  }
}

module.exports = (new EthChain());