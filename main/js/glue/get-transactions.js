"use strict";

const ctx = require('../context.js').get();

const log = ctx.logger.child({where:"get-transactions"});

function get_transactions({fromAddress, toAddress}) {
  log.info('in get_transactions ' + fromAddress)
  return {blah: 'meh'};
}

module.exports = get_transactions;