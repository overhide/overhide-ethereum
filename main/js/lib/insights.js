"use strict";

const applicationinsights = require('applicationinsights');

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
class Insights {
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
   * @param {string} insights_key - insights key
   * @returns {Insights} this
   */
  init({insights_key} = {}) {
    if (insights_key == null) {
      return;
    }

    this[ctx] = {
      insights_key: insights_key
    };

    applicationinsights.setup(insights_key)
      .setAutoDependencyCorrelation(false)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, false)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(false)
      .setAutoCollectConsole(false)
      .setUseDiskRetryCaching(false)
      .setSendLiveMetrics(false)
      .setDistributedTracingMode(applicationinsights.DistributedTracingModes.AI_AND_W3C)
      .setInternalLogging(false, false)
      .setAutoCollectHeartbeat(false)
      .start();
    
    return this;
  }
}

module.exports = (new Insights());