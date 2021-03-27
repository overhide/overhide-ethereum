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
  init({etherscan_key = null, etherscan_type = null, infura_project_id, infura_project_secret, ethereum_network} = {}) {
    if (infura_project_id == null) throw new Error("INFURA_PROJECT_ID must be specified.");
    if (infura_project_secret == null) throw new Error("INFURA_PROJECT_SECRET must be specified.");
    if (ethereum_network == null) throw new Error("INFURA_TYPE must be specified.");

    if (infura_project_id != 'fake') {
      var web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://${ethereum_network}.infura.io/ws/v3/${infura_project_id}`));
    } else {
      log(`fake infura project, skipping init...`);
    }

    this[ctx] = {
      infura_project_id: infura_project_id,
      infura_project_secret: infura_project_secret,
      ethereum_network: ethereum_network,
      web3: web3
    };
    this[metrics] = {
      txlistForAddressHits: 0
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
      throw err;
    }
  }

  /**
   * @param {number} index -- block index
   * @returns {[{block:.., from:.., to:.., time:.., value:..},..]} transactions with values in wei.
   */
  async getTransactionsForBlock(index) {
    this[checkInit]();
    try {
      const result = await this[ctx].web3.eth.getBlock(index, true);
      if (!result || !result.transactions || result.transactions.length == 0) return [];
      const block = result.number;
      const time = new Date(result.timestamp * 1000);
      return result.transactions.map(t => {
        return {
          block: block,
          from: t.from,
          to: t.to,
          time: time,
          value: t.value
        }
      });  
    } catch (err) {
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
   * @returns {{txlistForAddressHits:..}} metrics object.
   */
  metrics() {
    this[checkInit]();
    return this[metrics];
  }
}

module.exports = (new EthChain());