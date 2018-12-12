"use strict";

const eth = require('../lib/eth-chain.js');

const log = require('../lib/log.js').fn("get-transactions");
const debug = require('../lib/log.js').debug_fn("get-transactions");

async function get_transactions({fromAddress, toAddress, maxMostRecent = null, since = null, tallyOnly = false}) {
  if (typeof fromAddress !== 'string' || typeof toAddress !== 'string') throw new Error('fromAddress and toAddress must be strings');
  fromAddress = fromAddress.toLowerCase();
  toAddress = toAddress.toLowerCase();
  if (! fromAddress.startsWith('0x') || ! toAddress.startsWith('0x')) throw new Error('fromAddress and toAddress must start with 0x');
  var txs = await eth.getTransactionsForAddress(toAddress);
  debug.extend("txs")("etherscan result: %O", txs);
  var tally = 0;
  var result_txs = [];
  var txsSeen = 0;
  var sinceSeconds = since == null ? 0 : (new Date(since)).getTime() / 1000;
  for (var tx of txs.sort((a,b) => ((a.timeStamp - b.timeStamp) * -1))) {
    if (maxMostRecent) {
      if (txsSeen == maxMostRecent) break;
    }
    if (sinceSeconds > 0) {
      if (tx.timeStamp < sinceSeconds) break;
    }
    if (tx.from.toLowerCase() == fromAddress && tx.to.toLowerCase() == toAddress) {
      let value = parseInt(tx.value);
      tally += value;
      result_txs.push({
        "transaction-value": value,
        "transaction-date": new Date(tx.timeStamp * 1000).toISOString()
      });
      txsSeen++;
    }
  }  
  return tallyOnly ? {tally: tally} : {tally: tally, transactions: result_txs};
}

module.exports = get_transactions;