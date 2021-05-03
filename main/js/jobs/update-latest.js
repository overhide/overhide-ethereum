"use strict";

const eth = require('../lib/eth-chain.js');
const database = require('../lib/database.js');

const log = require('../lib/log.js').fn("update-latest");
const debug = require('../lib/log.js').debug_fn("update-latest");

const UPDATE_LATEST_JOB_PERIOD_MILLIS = process.env.UPDATE_LATEST_JOB_PERIOD_MILLIS || process.env.npm_config_UPDATE_LATEST_JOB_PERIOD_MILLIS || process.env.npm_package_config_UPDATE_LATEST_JOB_PERIOD_MILLIS || 30000;
const EXPECTED_CONFIRMATIONS = process.env.EXPECTED_CONFIRMATIONS || process.env.npm_config_EXPECTED_CONFIRMATIONS || process.env.npm_package_config_EXPECTED_CONFIRMATIONS || 7;

/**
 * Job function to update most recent ethereum blocks.
 */
async function go() {
  var timeout = UPDATE_LATEST_JOB_PERIOD_MILLIS;
  try {
    const latestBlock = (await eth.getLatestBlock()) - EXPECTED_CONFIRMATIONS;
    const dbMaxBlock = await database.getMaxBlock();

    if (dbMaxBlock === -1) {
      const transactions = await eth.getTransactionsForBlock(latestBlock);
      await database.addBlockTransactionsNoCheck(transactions);
      throw `Empty DB, added first block ${latestBlock}`;
    }

    var numTrasactions = 0;
    for(var block = dbMaxBlock + 1; block <= latestBlock; block++) {
      const transactions = await eth.getTransactionsForBlock(block);
      if (!transactions) break;
      try {
        await database.addBlockTransactions(transactions);
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