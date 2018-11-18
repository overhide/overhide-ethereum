"use strict";

const ctx = require('../context.js').get();

const log = ctx.log("get-transactions");
const debug = ctx.debug("get-transactions");

async function get_transactions({fromAddress, toAddress}) {
  if (typeof fromAddress !== 'string' || typeof toAddress !== 'string') throw new Error('fromAddress and toAddress must be strings');
  fromAddress = fromAddress.toLowerCase();
  toAddress = toAddress.toLowerCase();
  if (! fromAddress.startsWith('0x') || ! toAddress.startsWith('0x')) throw new Error('fromAddress and toAddress must start with 0x');
  var esApi = ctx.esApi; 
  var result = [];
  var txs = await esApi.account.txlist(fromAddress);
  debug.extend("txs")("etherscan result: %O", txs);
  if (txs.status != 1) throw new Error(txs.message);
  for (var tx of txs.result) {
    if (tx.from.toLowerCase() == fromAddress && tx.to.toLowerCase() == toAddress) {
      result.push({
        "transaction-value": tx.value,
        "transaction-date": new Date(tx.timeStamp * 1000).toISOString()
      });
    }    
  }  
  return result;
}

module.exports = get_transactions;