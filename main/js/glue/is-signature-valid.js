"use strict";

const ctx = require('../context.js').get();
const ethCrypto = require('eth-crypto');

const log = ctx.logger.child({where:"is-signature-valid"});

async function is_signature_valid({signature, message, address}) {
  if (typeof signature !== 'string' || typeof message !== 'string' || typeof address !== 'string') throw new Error('signature, message, address must be strings');

  // check address valid on blockchain
  address = address.toLowerCase();
  if (! address.startsWith('0x')) throw new Error('address must start with 0x');
  var esApi = ctx.esApi; 
  var txs = await esApi.account.txlist(address);
  if (txs.status != 1) throw new Error(txs.message);

  // check signature valid
  var msg = Buffer.from(message,"base64").toString("ascii");
  var sig = Buffer.from(signature,"base64").toString("ascii");
  var signedWithKey = ethCrypto.recover(sig, msg).toLowerCase();
  if (address != signedWithKey) throw new Error("invalid signature");
  return null;
}

module.exports = is_signature_valid;