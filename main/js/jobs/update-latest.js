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
  var timeout = UPDATE_LATEST_JOB_PERIOD_MILLIS;
  try {
    const latestBlock = await eth.getLatestBlock();
    const maxBlock = (await database.getMaxBlock()) || latestBlock - 1;
    var numTrasactions = 0;
    for(var block = maxBlock + 1; block <= latestBlock; block++) {
      const transactions = await eth.getTransactionsForBlock(block);
      if (!transactions) break;
      try {
        await database.addTransactions(transactions);
      } catch (err) {
        timeout = 0;
        log(`deleting blocks >= ${block - 1} because insertion error`);  
        await database.deleteBlock(block - 1);
        throw err;
      }
      
      var lastUpdated = block;
      log(`added block: ${block} (${transactions.filter(t => t.value > 0).length} txs)`);  
    }
  } catch (err) {
    log(`error: ${err}`);
  }

  setTimeout(go, timeout);
}

module.exports = go;