"use strict";

const express = require('express');
const ejs = require('ejs');
const http = require('http');
const os = require('os');
const path = require('path');
const rateLimit = require("express-rate-limit");
const terminus = require('@godaddy/terminus').createTerminus;

// CONFIGURATION CONSTANTS
//
// Try fetching from environment first (for Docker overrides etc.) then from npm config; fail-over to 
// hardcoded defaults.
const APP_NAME = "overhide-ethereum";
const OH_ETH_PORT = process.env.OH_ETH_PORT || process.env.npm_config_OH_ETH_PORT || process.env.npm_package_config_OH_ETH_PORT || 8080;
const BASIC_AUTH_ENABLED = process.env.BASIC_AUTH_ENABLED || process.env.npm_config_BASIC_AUTH_ENABLED || process.env.npm_package_config_BASIC_AUTH_ENABLED;
const DEBUG = process.env.DEBUG || process.env.npm_config_DEBUG || process.env.npm_package_config_DEBUG;
const KEYV_URI = process.env.KEYV_URI || process.env.npm_config_KEYV_URI || process.env.npm_package_config_KEYV_URI;
const KEYV_AUTH_NAMESPACE = process.env.KEYV_AUTH_NAMESPACE || process.env.npm_config_KEYV_AUTH_NAMESPACE || process.env.npm_package_config_KEYV_AUTH_NAMESPACE;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || process.env.npm_config_ETHERSCAN_KEY || process.env.npm_package_config_ETHERSCAN_KEY;
const ETHERSCAN_TYPE = process.env.ETHERSCAN_TYPE || process.env.npm_config_ETHERSCAN_TYPE || process.env.npm_package_config_ETHERSCAN_TYPE;
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || process.env.npm_config_RATE_LIMIT_WINDOW_MS || process.env.npm_package_config_RATE_LIMIT_WINDOW_MS || 60000;
const RATE_LIMIT_MAX_REQUESTS_PER_WINDOW = process.env.RATE_LIMIT_MAX_REQUESTS_PER_WINDOW || process.env.npm_config_RATE_LIMIT_MAX_REQUESTS_PER_WINDOW || process.env.npm_package_config_RATE_LIMIT_MAX_REQUESTS_PER_WINDOW || 10;

// Wire up application context
const ctx_config = {
  pid: process.pid,
  port: OH_ETH_PORT,
  app_name: APP_NAME, 
  basic_auth_enabled: /t/.test(BASIC_AUTH_ENABLED),
  debug: DEBUG,
  keyv_uri: KEYV_URI,
  keyv_auth_namespace: KEYV_AUTH_NAMESPACE,
  etherscan_key: ETHERSCAN_KEY,
  etherscan_type: ETHERSCAN_TYPE,
  ethereum_network: ETHERSCAN_TYPE,
  rateLimitWindowsMs: RATE_LIMIT_WINDOW_MS,
  rateLimitMax: RATE_LIMIT_MAX_REQUESTS_PER_WINDOW,
  swagger_urn: os.hostname + ':' + OH_ETH_PORT,
  swagger_endpoints_path: __dirname + path.sep + 'router.js'
};
const log = require('./lib/log.js').init(ctx_config).fn("app");
const debug = require('./lib/log.js').init(ctx_config).debug_fn("app");
const crypto = require('./lib/crypto.js').init(ctx_config);
const auth = require('./lib/auth.js').init(ctx_config);
const eth = require('./lib/eth-chain.js').init(ctx_config);
const swagger = require('./lib/swagger.js').init(ctx_config);
const basicAuthHandler = require('./lib/basic-auth-handler.js').init(ctx_config);
log("CONFIG:\n%O", ctx_config);

// Start the application
const app = express();
const router = require('./router');

// rate limiter
const throttle = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS_PER_WINDOW
});

//app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
app.use(express.static(__dirname + `${path.sep}..${path.sep}static`));
app.use(express.json());
app.use(throttle);
app.set('views', __dirname + `${path.sep}..${path.sep}static`);
app.engine('html', ejs.renderFile);
app.use("/", router);

// SERVER LIFECYCLE

const server = http.createServer(app);

function onSignal() {
  log('terminating: starting cleanup');1
  return Promise.all([
    database.terminate()
  ]);
}

async function onHealthCheck() {
  var healthy = true;
  let status = {
    healthy: healthy ? true : false,
    metrics: {
      eth: eth.metrics(),
      auth: auth.metrics()
    }
  };
  debug('onHealthCheck <= %o', status);
  return status;
}

terminus(server, {
  signal: 'SIGINT',
  healthChecks: {
    '/status.json': onHealthCheck,
  },
  onSignal
});

server.listen(OH_ETH_PORT);