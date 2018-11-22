"use strict";

const debug = require('debug');

// private attribtues
const ctx = Symbol('context');

// private functions
const checkInit = Symbol('checkInit');

/**
 * Wires up functionality we use throughout.
 * 
 * Module returns this class as object all wired-up.  Before you can use the methods you must "init" the object 
 * somewhere at process start.
 * 
 * Leverages node's module system for a sort of context & dependency injection, so order of requiring and initializing
 * these sorts of libraries matters.
 */
class Log {
  constructor() {
    this[ctx] = null;
  }

  // ensure this is initialized
  [checkInit]() {
    if (! this[ctx]) throw new Error('library not initialized, call "init" when wiring up app first');
  }
  
  /**
   * Initialize this library: this must be the first method called somewhere from where you're doing context & 
   * dependency injection.
   * 
   * Initializes the logger to always be on despite environment variable.  Initializes debug logger based on DEBUG 
   * environment variable.
   * 
   * @param app_name is the name of the application
   * @param debug is DEBUG environment setting for https://www.npmjs.com/package/debug
   * @return this
   */
  init({app_name, debug:debug_env}) {
    if (app_name == null) throw new Error("APP_NAME must be specified.");
    debug.enable((debug_env ? debug_env + ',' : '') + app_name + "-log:*");

    this[ctx] = {
      app_name: app_name,
      logger_name: app_name + "-log",
      debug_logger_name: app_name
    };
    return this;
  }

  /**
   * @param name to include in logger
   * @return is a function: the main "audit" logger (https://www.npmjs.com/package/debug) -- enabled by default 
   */
  fn(name) {
    this[checkInit]();
    return debug(this[ctx].logger_name).extend(name);
  }

  /**
   * @param name to include in logger
   * @return is a function: the debug logger (https://www.npmjs.com/package/debug) -- disabled by default
   */
  debug_fn(name) {
    this[checkInit]();
    return debug(this[ctx].debug_logger_name).extend(name);
  }
}

module.exports = (new Log());