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
    for(var block = maxBlock + 1; block <= latestBlock; block++) {
      const transactions = await eth.getTransactionsForBlock(block);
      if (!transactions) break;
      database.addTransactions(transactions);
      var lastUpdated = block;
    }
    if (lastUpdated) log(`added blocks: ${maxBlock} -> ${lastUpdated}`);  
  } catch (err) {
    log(`error: ${err}`);
  }

  setTimeout(go, UPDATE_LATEST_JOB_PERIOD_MILLIS);
}

module.exports = go;