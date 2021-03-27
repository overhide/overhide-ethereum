"use strict";

const eth = require('../lib/eth-chain.js');
const database = require('../lib/database.js');

const log = require('../lib/log.js').fn("seed-older");
const debug = require('../lib/log.js').debug_fn("seed-older");

const SEED_OLDER_JOB_PERIOD_MILLIS = process.env.SEED_OLDER_JOB_PERIOD_MILLIS || process.env.npm_config_SEED_OLDER_JOB_PERIOD_MILLIS || process.env.npm_package_config_SEED_OLDER_JOB_PERIOD_MILLIS || 30000;
const SEED_OLDER_NUMBER_BLOCKS = process.env.SEED_OLDER_NUMBER_BLOCKS || process.env.npm_config_SEED_OLDER_NUMBER_BLOCKS || process.env.npm_package_config_SEED_OLDER_NUMBER_BLOCKS || 5;

/**
 * Job function to update most recent ethereum blocks.
 */
async function go() {
  try {
    const minBlock = (await database.getMinBlock());
    if (!minBlock) {
      setTimeout(go, SEED_OLDER_JOB_PERIOD_MILLIS);
      return;
    }

    if (minBlock === 0) {
      log(`fetched all`);
      return;
    }

    for(var block = minBlock - 1; block >= 0 && block >= minBlock - SEED_OLDER_NUMBER_BLOCKS; block--) {
      const transactions = await eth.getTransactionsForBlock(block);
      if (!transactions) break;
      database.addTransactions(transactions);
      var lastUpdated = block;
    }
    if (lastUpdated) log(`added blocks: ${lastUpdated} -> ${minBlock}`);  
  } catch (err) {
    log(`error: ${err}`);
  }

  setTimeout(go, SEED_OLDER_JOB_PERIOD_MILLIS);
}

module.exports = go;