"use strict";

// CONFIGURATION CONSTANTS
//
// Try fetching from environment first (for Docker overrides etc.) then from npm config; fail-over to 
// hardcoded defaults.
const APP_NAME = "overhide-ethereum";
const OH_ETH_PORT = process.env.OH_ETH_PORT || process.env.npm_package_config_OH_ETH_PORT || 8080;
const LOG_LEVEL = process.env.LOG_LEVEL || process.env.npm_package_config_LOG_LEVEL || "info";
const KEYV_URI = process.env.KEYV_URI || process.env.npm_package_config_KEYV_URI;
const KEYV_AUTH_NAMESPACE = process.env.KEYV_AUTH_NAMESPACE || process.env.npm_package_config_KEYV_AUTH_NAMESPACE;

// Wire up application context
const ctx_config = {
  pid: process.pid,
  port: OH_ETH_PORT,
  app_name: APP_NAME, 
  log_level: LOG_LEVEL,
  keyv_uri: KEYV_URI,
  keyv_auth_namespace: KEYV_AUTH_NAMESPACE
};
const ctx = require('./context.js').wire(ctx_config);
const log = ctx.logger.child({where:"app"});
log.info({ctx_config: ctx_config});

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
    log.warn('exiting');
    process.exit();
  })});
