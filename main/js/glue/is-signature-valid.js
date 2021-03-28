"use strict";

const database = require('../lib/database.js');
const etherscan = require('../lib/etherscan.js');
const eth = require('../lib/eth-chain.js');

const log = require('../lib/log.js').fn("is-signature-valid");
const debug = require('../lib/log.js').debug_fn("is-signature-valid");

async function is_signature_valid({signature, message, address}) {
  if (typeof signature !== 'string' || typeof message !== 'string' || typeof address !== 'string') throw new Error('signature, message, address must be strings');

  // check address valid on blockchain
  address = address.toLowerCase();
  if (! address.startsWith('0x')) throw new Error('address must start with 0x');

  if (!await database.checkAddressIsTracked(address)) {
    const txs = await etherscan.getTransactionsForAddress(address);
    if (!txs || txs.length == 0) {
      throw `no transactions for address ${address} on chain.`;
    }
    await database.addTransactionsForNewAddress(txs, address);    
  }

  // check signature valid
  var msg = Buffer.from(message,"base64").toString("ascii");
  var sig = Buffer.from(signature,"base64").toString("ascii");
  if (!eth.isSignatureValid(address,sig,msg)) throw new Error("invalid signature");
  return null;
}

module.exports = is_signature_valid;