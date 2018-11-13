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
     *    web3_uri: URI to Web3 HttpProvider
     */
    wire: ({app_name = "app", log_level = "info", keyv_uri, keyv_auth_namespace, web3_uri} = {}) => {
      if (context != null) throw new Error("Attempt to wire up another context where context already exists.");
      if (keyv_uri == null) throw new Error("KEYV_URI must be specified: see README.md#Configuration.");
      if (keyv_auth_namespace == null) throw new Error("KEYV_AUTH_NAMESPACE must be specified: see README.md#Configuration.")
      if (web3_uri == null) throw new Error("WEB3_URI must be specified: see README.md#Configuration.")

      context = new Object();

      let logger = require('bunyan').createLogger({name: app_name});
      logger.level(log_level);

      let keyv_4_auth = new (require('keyv'))({
        uri: typeof keyv_uri=== 'string' && keyv_uri,
        store: typeof keyv_uri !== 'string' && keyv_uri,
        namespace: keyv_auth_namespace
      });

      let web3 = (() => {
        var web3 = null;
        return () => {
          if (web3 == null || web3.eth == null) {
            var Web3 = require('web3');
            web3 = new Web3(new Web3.providers.HttpProvider(web3_uri));
          }
          return web3.eth.net.isListening()
                  .then(() => {
                    return web3;
                  })
                  .catch((err) => {
                    logger.error('web3 connection failure :: ' + err);
                    web3 = null; // retry on next request
                  });
        };
      })();

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

      Object.defineProperty(context, "web3", {
        value: web3,
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
     *         web3:...
     *       } 
     * 
     *     where:
     *       - 'logger' is the 'bunyan' main logger.
     *       - 'keyv_4_auth' is the 'keyv' metadata key-value store abstraction for authenticated users
     *       - 'web3' is function that returns a connected web3 API as promise
     */
    get: () => {
      return context;
    }  

  };
})();

module.exports = context_singleton;