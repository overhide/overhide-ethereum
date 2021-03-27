"use strict";

const eth = require('../lib/eth-chain.js');
const database = require('../lib/database.js');

const log = require('../lib/log.js').fn("update-latest");
const debug = require('../lib/log.js').debug_fn("update-latest");

const UPDATE_LATEST_JOB_PERIOD_MILLIS = process.env.UPDATE_LATEST_JOB_PERIOD_MILLIS || process.env.npm_config_UPDATE_LATEST_JOB_PERIOD_MILLIS || process.env.npm_package_config_UPDATE_LATEST_JOB_PERIOD_MILLIS || 5000;

/**
 * Job function to update most recent ethereum blocks.
 */
async function go() {
  try {
    const latestBlock = await eth.getLatestBlock();
    const maxBlock = (await database.getMaxBlock()) || latestBlock - 1;
    var numTrasactions = 0;
    for(var block = maxBlock + 1; block <= latestBlock; block++) {
      const transactions = await eth.getTransactionsForBlock(block);
      if (!transactions) break;
      if (transactions.length == 0) {
        await database.addNullTransaction(block);
      } else {
        await database.addTransactions(transactions);
      }
      var lastUpdated = block;
      numTrasactions += transactions.length;
    }
    if (lastUpdated) log(`added blocks: ${maxBlock} -> ${lastUpdated} (${numTrasactions} txs)`);  
  } catch (err) {
    log(`error: ${err}`);
  }

  setTimeout(go, UPDATE_LATEST_JOB_PERIOD_MILLIS);
}

module.exports = go;