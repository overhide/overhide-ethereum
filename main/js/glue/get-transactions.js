"use strict";

const database = require('../lib/database.js');
const etherscan = require('../lib/etherscan.js');
const normalizer = require('../lib/normalizer.js');

const log = require('../lib/log.js').fn("get-transactions");
const debug = require('../lib/log.js').debug_fn("get-transactions");

const EXPECTED_CONFIRMATIONS = process.env.EXPECTED_CONFIRMATIONS || process.env.npm_config_EXPECTED_CONFIRMATIONS || process.env.npm_package_config_EXPECTED_CONFIRMATIONS || 7;

async function get_transactions({fromAddress, toAddress, maxMostRecent = null, since = null, asOf = null, tallyOnly = false, tallyDollars = false, includeRefunds = false, confirmations = 0}) {
  if (typeof fromAddress !== 'string' || typeof toAddress !== 'string') throw new Error('fromAddress and toAddress must be strings');
  fromAddress = fromAddress.toLowerCase();
  toAddress = toAddress.toLowerCase();
  if (! fromAddress.startsWith('0x') || ! toAddress.startsWith('0x')) throw new Error('fromAddress and toAddress must start with 0x');

  if (!await database.checkAddressIsTracked(fromAddress)) {
    await database.addTransactionsForNewAddress(await etherscan.getTransactionsForAddress(fromAddress), fromAddress);    
  }

  if (!await database.checkAddressIsTracked(toAddress)) {
    await database.addTransactionsForNewAddress(await etherscan.getTransactionsForAddress(toAddress), toAddress);        
  }

  var txs = await database.getTransactionsFromTo(fromAddress, toAddress);
  if (includeRefunds) {
    txs = [...txs,...await database.getTransactionsFromTo(toAddress, fromAddress)];
  }

  const highestAllowedBlock = (await database.getMaxBlock()) - Math.max((confirmations - EXPECTED_CONFIRMATIONS), 0);
  txs = txs.filter(t => t.block <= highestAllowedBlock);

  debug.extend("txs")("result: %O", txs);
  var tally = 0;
  var result_txs = [];
  var txsSeen = 0;
  var sinceSeconds = since == null ? 0 : (new Date(since)).getTime();
  var asOfSeconds = asOf == null ? Number.MAX_SAFE_INTEGER : (new Date(asOf)).getTime();
  for (var tx of txs.sort((a,b) => b.time.getTime() - a.time.getTime())) {
    if (maxMostRecent) {
      if (txsSeen == maxMostRecent) break;
    }
    if (sinceSeconds > 0) {
      if (tx.time.getTime() < sinceSeconds) break;
    }
    if (asOfSeconds > 0) {
      if (tx.time.getTime() > asOfSeconds) continue;
    }
    let value = parseInt(tx.value);
    if (tx.from.toLowerCase() == toAddress && tx.to.toLowerCase() == fromAddress) {
      value *= -1;
    } 
    result_txs.push({
      "transaction-value": value,
      "transaction-date": tx.time
    });
    tally += value;
    txsSeen++;
  }  

  if (tallyDollars) {
    tally = await normalizer.transform(result_txs);
  }

  return tallyOnly || tallyDollars ? {tally: tally, 'as-of': (new Date()).toISOString()} : {tally: tally, transactions: result_txs, 'as-of': (new Date()).toISOString()};
}

module.exports = get_transactions;