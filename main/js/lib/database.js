"use strict";

const Pool = require('pg').Pool;
const log = require('./log.js').fn("database");
const event = require('./log.js').fn("database-event");
const debug = require('./log.js').debug_fn("database");

// private attribtues
const ctx = Symbol('context');

// private functions
const checkInit = Symbol('checkInit');
const logEvent = Symbol('logEvent');

/**
 * Wires up functionality we use throughout.
 * 
 * Module returns this class as object all wired-up.  Before you can use the methods you must "init" the object 
 * somewhere at process start.
 * 
 * Leverages node's module system for a sort of context & dependency injection, so order of requiring and initializing
 * these sorts of libraries matters.
 */
class Database {
  constructor() {
    this[ctx] = null;
  }

  // ensure this is initialized
  [checkInit]() {
    if (! this[ctx]) throw new Error('library not initialized, call "init" when wiring up app first');
  }

  // use logging as DB event log (backup of sorts)
  //
  // @param {String} query -- to log
  // @param {*} params -- to log
  [logEvent](query, params = []) {   
    for (var i = 0; i < params.length; i++) {
      var param = params[i];
      query = query.replace(`$${i+1}`,`'${param}'`);
    }
    event(query);
  }

  /**
   * Initialize this library: this must be the first method called somewhere from where you're doing context & dependency
   * injection.
   * 
   * @param {string} pghost
   * @param {number} phport
   * @param {string} pgdatabase
   * @param {string} pguse
   * @param {string} pgpassword
   * @param {string} pgssl - true or false
   * @returns {Database} this
   */
  init({pghost,pgport,pgdatabase,pguser,pgpassword, pgssl} = {}) {
    if (pghost == null) throw new Error("POSTGRES_HOST must be specified.");
    if (pgport == null) throw new Error("POSTGRES_PORT must be specified.");
    if (pgdatabase == null) throw new Error("POSTGRES_DB must be specified.");
    if (pguser == null) throw new Error("POSTGRES_USER must be specified.");
    if (pgpassword == null) throw new Error("POSTGRES_PASSWORD must be specified.");

    const db = new Pool({
      host: pghost,
      port: pgport,
      database: pgdatabase,
      user: pguser,
      password: pgpassword,
      ssl: pgssl
    });

    this[ctx] = {
      db: db
    };
    
    return this;
  }

  /**
   * Add transactions
   * 
   * @param {[{block: number, from: string, to: string, time: Date, value: string},..]} transactions -- list of transactions to add; `from` and `to` are "0x" prefixed addresses.  
   */
  async addTransactions(transactions) {
    this[checkInit]();
    try {
      var values = transactions.map(t => `(${t.block}, ${t.from ? "decode('" + t.from.slice(2) + "','hex')" : null}, ${t.to ? "decode('" + t.to.slice(2) + "','hex')" : null}, '${t.time.toISOString()}', '${t.value}')`);
      values = values.join(',');
      const query = `INSERT INTO ethtxs (block, fromaddr, toaddr, transactionts, value) VALUES ${values} ON CONFLICT (block, fromaddr, toaddr, transactionts, value) DO NOTHING;`;
      await this[ctx].db.query(query);
    } catch (err) {
      throw `insertion error :: ${String(err)}`;
    }
  }

  /**
   * Get transactions for block
   * 
   * @param {number} block -- block to get transactions for.
   * @returns {[{block: number, from: string, to: string, time: Date, value: string},..]} transactions
   */
   async getTransactionsForBlock(block) {
    this[checkInit]();
    try {
      const query = `SELECT * FROM ethtxs WHERE block = $1 ORDER BY transactionts DESC`;
      const params = [block];
      debug('%s', query);
      let result = await this[ctx].db.query(query, params);
      if (result.rowCount == 0) {
        return [];
      }
      result = result.rows.map(row => {
        return {
          block: row.block,
          from: row.fromaddr ? `0x${row.fromaddr.toString('hex')}` : null,
          to: row.toaddr ? `0x${row.toaddr.toString('hex')}` : null,
          time: row.transactionts,
          value: row.value
        };     
      });
      return result;
    } catch (err) {
      throw `getTransactionsForBlock error :: ${String(err)}`;
    }
  }

  /**
   * Get transactions for address
   * 
   * @param {string} address -- '0x' prefixed address to get transactions for.
   * @returns {[{block: number, from: string, to: string, time: Date, value: string},..]} transactions
   */
   async getTransactionsFor(address) {
    this[checkInit]();
    try {
      const query = `SELECT * FROM ethtxs WHERE (fromaddr = decode($1,'hex') OR toaddr = decode($2,'hex')) ORDER BY transactionts DESC`;
      const params = [address.slice(2), address.slice(2)];
      debug('%s', query);
      let result = await this[ctx].db.query(query, params);
      if (result.rowCount == 0) {
        return [];
      }
      result = result.rows.map(row => {
        return {
          block: row.block,
          from: row.fromaddr ? `0x${row.fromaddr.toString('hex')}` : null,
          to: row.toaddr ? `0x${row.toaddr.toString('hex')}` : null,
          time: row.transactionts,
          value: row.value
        };     
      });
      return result;
    } catch (err) {
      throw `getTransactionsFor error :: ${String(err)}`;
    }
  }

  /**
   * Get transactions for address
   * 
   * @param {string} fromAddress -- '0x' prefixed address to get transactions for.
   * @param {string} toAddress -- '0x' prefixed recepient address to get transactions for.
   * @returns {[{block: number, from: string, to: string, time: Date, value: string},..]} transactions
   */
  async getTransactionsFromTo(fromAddress, toAddress) {
    this[checkInit]();
    try {
      const query = `SELECT * FROM ethtxs WHERE (fromaddr = decode($1,'hex') AND toaddr = decode($2,'hex')) ORDER BY transactionts DESC`;
      const params = [fromAddress.slice(2), toAddress.slice(2)];
      debug('%s', query);
      let result = await this[ctx].db.query(query, params);
      if (result.rowCount == 0) {
        return [];
      }
      result = result.rows.map(row => {
        return {
          block: row.block,
          from: row.fromaddr ? `0x${row.fromaddr.toString('hex')}` : null,
          to: row.toaddr ? `0x${row.toaddr.toString('hex')}` : null,
          time: row.transactionts,
          value: row.value
        };     
      });
      return result;
    } catch (err) {
      throw `getTransactionsFromTo error :: ${String(err)}`;
    }
  }

  /**
   * Get largest block number
   * 
   * @returns {number} largest (most recent) known block number.
   */
  async getMaxBlock() {
    this[checkInit]();
    try {
      const query = `SELECT max(block) FROM ethtxs`;
      let result = await this[ctx].db.query(query);
      if (result.rowCount == 0) {
        return [];
      }
      return result.rows[0].max;
    } catch (err) {
      throw `getMaxBlock error :: ${String(err)}`;
    }
  }

  /**
   * Get min block number
   * 
   * @returns {number} smallest (oldest) known block number.
   */
   async getMinBlock() {
    this[checkInit]();
    try {
      const query = `SELECT min(block) FROM ethtxs`;
      let result = await this[ctx].db.query(query);
      if (result.rowCount == 0) {
        return [];
      }
      return result.rows[0].min;
    } catch (err) {
      throw `getMinBlock error :: ${String(err)}`;
    }
  }  

  /**
   * Call when process is exiting.
   */
  async terminate() {
    this[checkInit]();
    debug(`terminating`);
    await this[ctx].db.end();
  }

  /**
   * @returns {string} null if no error else error string if problem using DB from connection pool.
   */
  async getError() {
    this[checkInit]();
    try {
      var client = await this[ctx].db.connect();
      const res = await client.query('SELECT NOW()');
      return null;
    } catch (err) {
      log(`not healthy: ${String(err)}`);
      return String(err);
    } finally {
      if (client) client.release()
    }    
  }
}

module.exports = (new Database());