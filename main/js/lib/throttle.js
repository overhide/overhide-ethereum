"use strict";

const debug = require('./log.js').debug_fn("throttle");
const rateLimit = require("express-rate-limit");

// private attribtues
const ctx = Symbol('context');

// private functions
const checkInit = Symbol('checkInit');
const frontendThrottle = Symbol('frontendThrottle');
const backendThrottle = Symbol('backendThrottle');
const RedisStore = require("rate-limit-redis");

/**
 * Wires up functionality we use throughout.
 * 
 * Module returns this class as object all wired-up.  Before you can use the methods you must "init" the object 
 * somewhere at process start.
 * 
 * Leverages node's module system for a sort of context & dependency injection, so order of requiring and initializing
 * these sorts of libraries matters.
 */
class Throttle {
  constructor() {
    this[ctx] = null;
  }

  // ensure this is initialized
  [checkInit]() {
    if (! this[ctx]) throw new Error('library not initialized, call "init" when wiring up app first');
  }

  /**
   * Initialize this library: this must be the first method called somewhere from where you're doing context & dependency
   * injection.
   * 
   * @param {number} rateLimitFeMax
   * @param {number} rateLimitFeWindowsMs
   * @param {string} rateLimitFeRedis
   * @param {string} rateLimitFeRedisNamespace
   * @param {number} rateLimitBeMax
   * @param {number} rateLimitBeWindowsMs
   * @param {string} rateLimitBeRedis
   * @param {string} rateLimitBeRedisNamespace
   * @returns {Throttle} this
   */
  init({rateLimitFeMax, rateLimitFeWindowsMs, rateLimitFeRedis, rateLimitFeRedisNamespace, rateLimitBeMax, rateLimitBeWindowsMs, rateLimitBeRedis, rateLimitBeRedisNamespace} = {}) {
    if (rateLimitFeMax == null || rateLimitFeWindowsMs == null) throw new Error("Both RATE_LIMIT_FE_WINDOW_MS and RATE_LIMIT_FE_MAX_REQUESTS_PER_WINDOW must be specified.");
    if (rateLimitBeMax == null || rateLimitBeWindowsMs == null) throw new Error("Both RATE_LIMIT_BE_WINDOW_MS and RATE_LIMIT_BE_MAX_REQUESTS_PER_WINDOW must be specified.");
   
    this[ctx] = {
    };

    this[frontendThrottle] = rateLimit({
      store: new RedisStore({
        expiry: rateLimitFeWindowsMs / 1000,
        prefix: rateLimitFeRedisNamespace,
        redisURL: rateLimitFeRedis
      }),
      windowMs: rateLimitFeWindowsMs,
      max: rateLimitFeMax
    });
  
    this[backendThrottle] = rateLimit({
      store: new RedisStore({
        expiry: rateLimitBeWindowsMs / 1000,
        prefix: rateLimitBeRedisNamespace,
        redisURL: rateLimitBeRedis
      }),
      windowMs: rateLimitBeWindowsMs,
      max: rateLimitBeMax
    });

    return this;
  }

  /**
   * Check token for validity.
   * tokenUrl, 
   * @param {}  req
   * @param {} res
   * @param {} next
   * @returns {} response or calls next() to continue chain
   */
  async check(req, res, next) {
    this[checkInit]();
    if (res.locals.internal) {
      next();
    } else if (res.locals.backend) {
      this[backendThrottle](req, res, next);
      return;
    } else {
      this[frontendThrottle](req, res, next);
      return;
    }
  }
}

module.exports = (new Throttle());