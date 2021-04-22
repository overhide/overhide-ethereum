"use strict";

const debug = require('./log.js').debug_fn("throttle");
const rateLimit = require("express-rate-limit");

// private attribtues
const ctx = Symbol('context');

// private functions
const checkInit = Symbol('checkInit');
const regularThrottle = Symbol('regularThrottle');
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
   * @param {number} rateLimitMax
   * @param {number} rateLimitWindowsMs
   * @param {string} rateLimitRedis
   * @param {string} rateLimitRedisNamespace
   * @returns {Throttle} this
   */
  init({rateLimitMax, rateLimitWindowsMs, rateLimitRedis, rateLimitRedisNamespace} = {}) {
    if (rateLimitMax == null || rateLimitWindowsMs == null) throw new Error("Both RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX_REQUESTS_PER_WINDOW must be specified.");

    this[ctx] = {
    };

    this[regularThrottle] = rateLimit({
      store: new RedisStore({
        expiry: rateLimitWindowsMs / 1000,
        prefix: rateLimitRedisNamespace,
        redisURL: rateLimitRedis
      }),
      windowMs: rateLimitWindowsMs,
      max: rateLimitMax
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
    if (!res.locals.internal) {
      this[regularThrottle](req, res, next);
      return;
    }

    next();
  }
}

module.exports = (new Throttle());