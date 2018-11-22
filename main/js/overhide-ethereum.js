"use strict";

// CONFIGURATION CONSTANTS
//
// Try fetching from environment first (for Docker overrides etc.) then from npm config; fail-over to 
// hardcoded defaults.
const APP_NAME = "overhide-ethereum";
const OH_ETH_PORT = process.env.OH_ETH_PORT || process.env.npm_package_config_OH_ETH_PORT || 8080;
const DEBUG = process.env.DEBUG || process.env.npm_package_config_DEBUG;
const KEYV_URI = process.env.KEYV_URI || process.env.npm_package_config_KEYV_URI;
const KEYV_AUTH_NAMESPACE = process.env.KEYV_AUTH_NAMESPACE || process.env.npm_package_config_KEYV_AUTH_NAMESPACE;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || process.env.npm_package_config_ETHERSCAN_KEY;
const ETHERSCAN_TYPE = process.env.ETHERSCAN_TYPE || process.env.npm_package_config_ETHERSCAN_TYPE;

// Wire up application context
const ctx_config = {
  pid: process.pid,
  port: OH_ETH_PORT,
  app_name: APP_NAME, 
  debug: DEBUG,
  keyv_uri: KEYV_URI,
  keyv_auth_namespace: KEYV_AUTH_NAMESPACE,
  etherscan_key: ETHERSCAN_KEY,
  etherscan_type: ETHERSCAN_TYPE
};
const log = require('./lib/log.js').init(ctx_config).fn("app");
const crypto = require('./lib/crypto.js').init(ctx_config);
const keyv4auth = require('./lib/keyv-4-auth.js').init(ctx_config);
const eth = require('./lib/eth-chain.js').init(ctx_config);
log("CONFIG:\n%O", ctx_config);

// Start the application
const app = require('express')();
const router = require('./router');

app.use("/", router);
app.listen(OH_ETH_PORT);
exports.app = app;  

// Handle exit
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, (err) => {
    err && console.log("Error: " + err);
    log('exiting');
    process.exit();
  })});
