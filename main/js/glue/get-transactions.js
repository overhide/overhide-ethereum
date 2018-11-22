"use strict";

const eth = require('../lib/eth-chain.js');

const log = require('../lib/log.js').fn("get-transactions");
const debug = require('../lib/log.js').debug_fn("get-transactions");

async function get_transactions({fromAddress, toAddress}) {
  if (typeof fromAddress !== 'string' || typeof toAddress !== 'string') throw new Error('fromAddress and toAddress must be strings');
  fromAddress = fromAddress.toLowerCase();
  toAddress = toAddress.toLowerCase();
  if (! fromAddress.startsWith('0x') || ! toAddress.startsWith('0x')) throw new Error('fromAddress and toAddress must start with 0x');
  var result = [];
  var txs = await eth.getTransactionsForAddress(fromAddress);
  debug.extend("txs")("etherscan result: %O", txs);
  for (var tx of txs) {
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