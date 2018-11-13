"use strict";

const ctx = require('../context.js').get();

const log = ctx.logger.child({where:"get-transactions"});

async function get_transactions({fromAddress, toAddress}) {
  var web3 = await ctx.web3();
  log.info('is connected: ' + web3);
  log.info('in get_transactions ' + fromAddress)
  return {blah: 'meh'};
}

module.exports = get_transactions;