"use strict";

/** 
 * Context & Dependency Injection style context.
 * 
 * Wire up your "beans" here.
 * 
 * Try to "use strict"; in your code.
 * 
 * Require this 'context' module then in app entry-point call the 'wire' function with all the necessary options.
 * 
 * In all other code modules require this 'context' and only call the 'get' function to access returned 'beans'.
 */

const context_singleton = (function() {
  let context = null;

  return {

    /**
     * Wire-up the CDI.  Each property in returned context is a "bean".
     * 
     * @param {*} options 
     * 
     *    app_name: is the name of the application
     *    log_level: a 'bunyan' log level such as 'info', 'warn', 'debug', 'trace'
     *    keyv_uri: 'keyv' adapter uri for key-value abstraction 'keyv'
     *    keyv_auth_namespace: namespace to use in 'keyv' data store for authenticating
     *    etherscan_key: Key for etherscan.io API access
     *    etherscan_type: Type of network for etherscan.io access ("","ropsten","rinkeby","morden")
     */
    wire: ({app_name = "app", log_level = "info", keyv_uri, keyv_auth_namespace, etherscan_key, etherscan_type} = {}) => {
      if (context != null) throw new Error("Attempt to wire up another context where context already exists.");
      if (keyv_uri == null) throw new Error("KEYV_URI must be specified: see README.md#Configuration.");
      if (keyv_auth_namespace == null) throw new Error("KEYV_AUTH_NAMESPACE must be specified: see README.md#Configuration.")
      if (etherscan_key == null) throw new Error("ETHERSCAN_KEY must be specified: see README.md#Configuration.")

      context = new Object();

      let logger = require('bunyan').createLogger({name: app_name});
      logger.level(log_level);

      let keyv_4_auth = new (require('keyv'))({
        uri: typeof keyv_uri=== 'string' && keyv_uri,
        store: typeof keyv_uri !== 'string' && keyv_uri,
        namespace: keyv_auth_namespace
      });

      if (esApi == null) {
        if (etherscan_type) {
          var esApi = require('etherscan-api').init(etherscan_key, etherscan_type);
        } else {
          var esApi = require('etherscan-api').init(etherscan_key);
        }
      }

      Object.defineProperty(context, "logger", {
        value: logger,
        writable: false,
        enumerable: true,
        configurable: true
      });

      Object.defineProperty(context, "keyv_4_auth", {
        value: keyv_4_auth,
        writable: false,
        enumerable: true,
        configurable: true
      });

      Object.defineProperty(context, "esApi", {
        value: esApi,
        writable: false,
        enumerable: true,
        configurable: true
      });

      context = Object.freeze(context);

      return context;
    },

    /**
     * @return Application context with beans:
     * 
     *       {
     *         logger:...,
     *         keyv_4_auth:...,
     *         esApi:...
     *       } 
     * 
     *     where:
     *       - 'logger' is the 'bunyan' main logger.
     *       - 'keyv_4_auth' is the 'keyv' metadata key-value store abstraction for authenticated users
     *       - 'esApi' is the API as per https://github.com/sebs/etherscan-api
     */
    get: () => {
      return context;
    }  

  };
})();

module.exports = context_singleton;