"use strict";

const express = require('express');
const ejs = require('ejs');
const http = require('http');
const os = require('os');
const path = require('path');
const { createTerminus: terminus, HealthCheckError } = require('@godaddy/terminus');

// CONFIGURATION CONSTANTS
//
// Try fetching from environment first (for Docker overrides etc.) then from npm config; fail-over to 
// hardcoded defaults.
const APP_NAME = "overhide-ethereum";
const VERSION = process.env.npm_package_version;
const OH_ETH_HOST = process.env.OH_ETH_HOST || process.env.npm_config_OH_ETH_HOST || process.env.npm_package_config_OH_ETH_HOST || 'localhost';
const OH_ETH_PORT = process.env.OH_ETH_PORT || process.env.npm_config_OH_ETH_PORT || process.env.npm_package_config_OH_ETH_PORT || 8080;
const BASE_URL = process.env.BASE_URL || process.env.npm_config_BASE_URL || process.env.npm_package_config_BASE_URL || 'localhost:8080';
const DEBUG = process.env.DEBUG || process.env.npm_config_DEBUG || process.env.npm_package_config_DEBUG;
const SALT = process.env.SALT || process.env.npm_config_SALT || process.env.npm_package_config_SALT;
const TOKEN_URL = process.env.TOKEN_URL || process.env.npm_config_TOKEN_URL || process.env.npm_package_config_TOKEN_URL;
const ISPROD = process.env.ISPROD || process.env.npm_config_ISPROD || process.env.npm_package_config_ISPROD || false;
const INSIGHTS_KEY = process.env.INSIGHTS_KEY || process.env.npm_config_INSIGHTS_KEY || process.env.npm_package_config_INSIGHTS_KEY
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || process.env.npm_config_INTERNAL_TOKEN || process.env.npm_package_config_INTERNAL_TOKEN;
const WEB3_URI = process.env.WEB3_URI || process.env.npm_config_WEB3_URI || process.env.npm_package_config_WEB3_URI;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || process.env.npm_config_ETHERSCAN_KEY || process.env.npm_package_config_ETHERSCAN_KEY;
const NETWORK_TYPE = process.env.NETWORK_TYPE || process.env.npm_config_NETWORK_TYPE || process.env.npm_package_config_NETWORK_TYPE;
const RATE_LIMIT_FE_WINDOW_MS = process.env.RATE_LIMIT_FE_WINDOW_MS || process.env.npm_config_RATE_LIMIT_FE_WINDOW_MS || process.env.npm_package_config_RATE_LIMIT_FE_WINDOW_MS || 60000;
const RATE_LIMIT_FE_MAX_REQUESTS_PER_WINDOW = process.env.RATE_LIMIT_FE_MAX_REQUESTS_PER_WINDOW || process.env.npm_config_RATE_LIMIT_FE_MAX_REQUESTS_PER_WINDOW || process.env.npm_package_config_RATE_LIMIT_FE_MAX_REQUESTS_PER_WINDOW || 10;
const RATE_LIMIT_FE_REDIS_URI = process.env.RATE_LIMIT_FE_REDIS_URI || process.env.npm_config_RATE_LIMIT_FE_REDIS_URI || process.env.npm_package_config_RATE_LIMIT_FE_REDIS_URI || null;
const RATE_LIMIT_FE_REDIS_NAMESPACE = process.env.RATE_LIMIT_FE_REDIS_NAMESPACE || process.env.npm_config_RATE_LIMIT_FE_REDIS_NAMESPACE || process.env.npm_package_config_RATE_LIMIT_FE_REDIS_NAMESPACE || "rate-limit";
const RATE_LIMIT_BE_WINDOW_MS = process.env.RATE_LIMIT_BE_WINDOW_MS || process.env.npm_config_RATE_LIMIT_BE_WINDOW_MS || process.env.npm_package_config_RATE_LIMIT_BE_WINDOW_MS || 60000;
const RATE_LIMIT_BE_MAX_REQUESTS_PER_WINDOW = process.env.RATE_LIMIT_BE_MAX_REQUESTS_PER_WINDOW || process.env.npm_config_RATE_LIMIT_BE_MAX_REQUESTS_PER_WINDOW || process.env.npm_package_config_RATE_LIMIT_BE_MAX_REQUESTS_PER_WINDOW || 10;
const RATE_LIMIT_BE_REDIS_URI = process.env.RATE_LIMIT_BE_REDIS_URI || process.env.npm_config_RATE_LIMIT_BE_REDIS_URI || process.env.npm_package_config_RATE_LIMIT_BE_REDIS_URI || null;
const RATE_LIMIT_BE_REDIS_NAMESPACE = process.env.RATE_LIMIT_BE_REDIS_NAMESPACE || process.env.npm_config_RATE_LIMIT_BE_REDIS_NAMESPACE || process.env.npm_package_config_RATE_LIMIT_BE_REDIS_NAMESPACE || "rate-limit";
const KEYV_TALLY_CACHE_URI = process.env.KEYV_TALLY_CACHE_URI || process.env.npm_config_KEYV_TALLY_CACHE_URI || process.env.npm_package_config_KEYV_TALLY_CACHE_URI;
const EXPECTED_CONFIRMATIONS = process.env.EXPECTED_CONFIRMATIONS || process.env.npm_config_EXPECTED_CONFIRMATIONS || process.env.npm_package_config_EXPECTED_CONFIRMATIONS || 7;
const POSTGRES_HOST = process.env.POSTGRES_HOST || process.env.npm_config_POSTGRES_HOST || process.env.npm_package_config_POSTGRES_HOST || 'localhost'
const POSTGRES_PORT = process.env.POSTGRES_PORT || process.env.npm_config_POSTGRES_PORT || process.env.npm_package_config_POSTGRES_PORT || 5432
const POSTGRES_DB = process.env.POSTGRES_DB || process.env.npm_config_POSTGRES_DB || process.env.npm_package_config_POSTGRES_DB || 'oh-eth';
const POSTGRES_USER = process.env.POSTGRES_USER || process.env.npm_config_POSTGRES_USER || process.env.npm_package_config_POSTGRES_USER || 'adam';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || process.env.npm_config_POSTGRES_PASSWORD || process.env.npm_package_config_POSTGRES_PASSWORD || 'c0c0nut';
const POSTGRES_SSL = process.env.POSTGRES_SSL || process.env.npm_config_POSTGRES_SSL || process.env.npm_package_config_POSTGRES_SSL;
const IS_WORKER = process.env.IS_WORKER || process.env.npm_config_IS_WORKER || process.env.npm_package_config_IS_WORKER;

// Wire up application context
const ctx_config = {
  pid: process.pid,
  app_name: APP_NAME, 
  version: VERSION,
  host: OH_ETH_HOST,
  port: OH_ETH_PORT,
  debug: DEBUG,
  salt: SALT,
  internalToken: INTERNAL_TOKEN,
  tokenUrl: TOKEN_URL,
  isProd: ISPROD && /true/i.test(ISPROD),
  isTest: !(!!ISPROD && /true/i.test(ISPROD)),
  insights_key: INSIGHTS_KEY,
  etherscan_key: ETHERSCAN_KEY,
  ethereum_network: NETWORK_TYPE,
  web3_uri: WEB3_URI,
  rateLimitFeWindowsMs: RATE_LIMIT_FE_WINDOW_MS,
  rateLimitFeMax: RATE_LIMIT_FE_MAX_REQUESTS_PER_WINDOW,
  rateLimitFeRedis: RATE_LIMIT_FE_REDIS_URI,
  rateLimitFeRedisNamespace: RATE_LIMIT_FE_REDIS_NAMESPACE,
  rateLimitBeWindowsMs: RATE_LIMIT_BE_WINDOW_MS,
  rateLimitBeMax: RATE_LIMIT_BE_MAX_REQUESTS_PER_WINDOW,
  rateLimitBeRedis: RATE_LIMIT_BE_REDIS_URI,
  rateLimitBeRedisNamespace: RATE_LIMIT_BE_REDIS_NAMESPACE,
  keyv_tally_cache_uri: KEYV_TALLY_CACHE_URI,
  confirmations: EXPECTED_CONFIRMATIONS,
  base_url: BASE_URL,
  swagger_endpoints_path: __dirname + path.sep + 'router.js',
  pghost: POSTGRES_HOST,
  pgport: POSTGRES_PORT,
  pgdatabase: POSTGRES_DB,
  pguser: POSTGRES_USER,
  pgpassword: POSTGRES_PASSWORD,
  pgssl: POSTGRES_SSL,
  isWorker: !!IS_WORKER && /true/i.test(IS_WORKER)
};
const log = require('./lib/log.js').init(ctx_config).fn("app");
const debug = require('./lib/log.js').init(ctx_config).debug_fn("app");
const insights_key = require('./lib/insights.js').init(ctx_config);
const crypto = require('./lib/crypto.js').init(ctx_config);
const eth = require('./lib/eth-chain.js').init(ctx_config);
const etherscan = require('./lib/etherscan.js').init(ctx_config);
const database = require('./lib/database.js').init(ctx_config);
const swagger = require('./lib/swagger.js').init(ctx_config);
const token = require('./lib/token.js').init(ctx_config);
const throttle = require('./lib/throttle.js').init(ctx_config);
const normalizer = require('./lib/normalizer.js').init(ctx_config);
const tallyCache = require('./lib/tally-cache.js').init(ctx_config);
log("CONFIG:\n%O", ((cfg) => {
  cfg.insights_key = cfg.insights_key ? cfg.insights_key.replace(/.(?=.{2})/g,'*') : null; 
  cfg.web3_uri = cfg.web3_uri.replace(/.(?=.{2})/g,'*'); 
  cfg.etherscan_key = cfg.etherscan_key.replace(/.(?=.{2})/g,'*'); 
  cfg.pgpassword = cfg.pgpassword.replace(/.(?=.{2})/g,'*'); 
  cfg.salt = cfg.salt.replace(/.(?=.{2})/g,'*'); 
  cfg.internalToken = cfg.internalToken.replace(/.(?=.{2})/g,'*'); 
  return cfg;
})({...ctx_config}));

// WORKER JOBS
if (ctx_config.isWorker) {
  require('./jobs/update-latest')();
}

// START THE APPLICATION
const app = express();
const router = require('./router');

//app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
app.use(express.static(__dirname + `${path.sep}..${path.sep}static`));
app.use(express.json());
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
  const etherscanMetrics = etherscan.metrics();
  const ethMetrics = eth.metrics();
  const dbMetrics = database.metrics();
  const normalizerMetrics = normalizer.metrics();
  const tallyCacheMetrics = tallyCache.metrics();
  var healthy = etherscanMetrics.errors === 0 && ethMetrics.errors === 0 && dbMetrics.errorsDelta === 0  && normalizerMetrics.errorsDelta === 0 && tallyCacheMetrics.errorsDelta === 0;
  if (!healthy) {
    let reason = `onHealthCheck failed: etherscanErros:${etherscanMetrics.errors}, ethErrors:${ethMetrics.errors}, dbErrors:${dbMetrics.errorsDelta}, normalizerErrors: ${normalizerMetrics.errorsDelta}, tallyCacheErrors: ${tallyCacheMetrics.errorsDelta}`;
    log(reason);
    throw new HealthCheckError('healtcheck failed', [reason])
  }
  let status = {
    host: os.hostname(),
    version: VERSION,
    worker: ctx_config.isWorker,
    healthy: healthy ? true : false,
    metrics: {
      etherscanMetrics: etherscanMetrics,
      ethMetrics: ethMetrics,
      dbMetrics: dbMetrics,
      normalizerMetrics: normalizerMetrics,      
      tallyCacheMetrics: tallyCacheMetrics,
      earliestBlockDb: await database.getMinBlock(),
      latestBlockDb: await database.getMaxBlock()
    }
  };  
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