"use strict";

const database = require('../lib/database.js');

const log = require('../lib/log.js').fn("get-block");
const debug = require('../lib/log.js').debug_fn("get-block");

async function get_block(block) {
  return database.getTransactionsForBlock(block);
}

module.exports = get_block;