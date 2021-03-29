const eth_acct1 = '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F12'; 
const eth_acct1_priv = '0x0c0af234fd5d4071257f2f7e0cd4d4d5b35544ca64068d98c002c05a444e4fe0';

const eth_acct2 = '0x6A23B59ff43F82B761162DFc5b6F0F461210EC77';
const eth_acct2_priv = '0xf272821a099ac068f9e4f464bebad92a7ff1404daeb1d3f739777827380e1019';

const POINT_0_1_ETH_IN_WEI = 10000000000000000;

const OH_ETH_HOST = process.env.OH_ETH_HOST || process.env.npm_config_OH_ETH_HOST || process.env.npm_package_config_OH_ETH_HOST || 'localhost';
const OH_ETH_PORT = process.env.OH_ETH_PORT || process.env.npm_config_OH_ETH_PORT || process.env.npm_package_config_OH_ETH_PORT || 8080;
const TOKEN_URL = `https://token.overhide.io/token`;
const API_KEY = '0x___API_KEY_ONLY_FOR_DEMOS_AND_TESTS___';
const POSTGRES_HOST = process.env.POSTGRES_HOST || process.env.npm_config_POSTGRES_HOST || process.env.npm_package_config_POSTGRES_HOST || 'localhost'
const POSTGRES_PORT = process.env.POSTGRES_PORT || process.env.npm_config_POSTGRES_PORT || process.env.npm_package_config_POSTGRES_PORT || 5432
const POSTGRES_DB = process.env.POSTGRES_DB || process.env.npm_config_POSTGRES_DB || process.env.npm_package_config_POSTGRES_DB || 'oh-eth';
const POSTGRES_USER = process.env.POSTGRES_USER || process.env.npm_config_POSTGRES_USER || process.env.npm_package_config_POSTGRES_USER || 'adam';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || process.env.npm_config_POSTGRES_PASSWORD || process.env.npm_package_config_POSTGRES_PASSWORD || 'c0c0nut';
const POSTGRES_SSL = process.env.POSTGRES_SSL || process.env.npm_config_POSTGRES_SSL || process.env.npm_package_config_POSTGRES_SSL;


const chai = require('chai');
const chaiHttp = require('chai-http');
require('../../main/js/lib/log.js').init({app_name:'smoke'});
const crypto = require('../../main/js/lib/crypto.js').init();
const eth = require('../../main/js/lib/eth-chain.js').init({
  infura_project_id: 'fake',
  infura_project_secret: 'fake',
  ethereum_network: 'rinkeby'
});
const database = require('../../main/js/lib/database.js').init({
  pghost: POSTGRES_HOST,
  pgport: POSTGRES_PORT,
  pgdatabase: POSTGRES_DB,
  pguser: POSTGRES_USER,
  pgpassword: POSTGRES_PASSWORD,
  pgssl: POSTGRES_SSL
});
const uuid = require('uuid');
const assert = chai.assert;

var TOKEN;

chai.use(chaiHttp);

database.addTransactionsForNewAddress([
  {block: 4340653, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F12', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC77', value: '10000000000000000', time: new Date('2019-05-07T14:27:36Z'), hash:'0x00'},
  {block: 4340653, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F13', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC77', value: '10000000000000000', time: new Date('2019-05-07T14:27:36Z'), hash:'0x00'},
  {block: 4340653, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F12', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC76', value: '10000000000000000', time: new Date('2019-05-07T14:27:36Z'), hash:'0x00'},
  {block: 4340653, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F13', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC76', value: '10000000000000000', time: new Date('2019-05-07T14:27:36Z'), hash:'0x00'},
], '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F12');
database.addTransactionsForNewAddress([
  {block: 4340619, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F12', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC77', value: '10000000000000000', time: new Date('2019-05-07T14:19:06Z'), hash:'0x00'},
  {block: 4340619, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F13', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC77', value: '10000000000000000', time: new Date('2019-05-07T14:19:06Z'), hash:'0x00'},
  {block: 4340619, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F12', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC76', value: '10000000000000000', time: new Date('2019-05-07T14:19:06Z'), hash:'0x00'},
  {block: 4340619, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F13', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC76', value: '10000000000000000', time: new Date('2019-05-07T14:19:06Z'), hash:'0x00'},
  {block: 4340599, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F12', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC77', value: '10000000000000000', time: new Date('2019-05-07T14:14:06Z'), hash:'0x00'},
  {block: 4340599, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F13', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC77', value: '10000000000000000', time: new Date('2019-05-07T14:14:06Z'), hash:'0x00'},
  {block: 4340599, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F12', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC76', value: '10000000000000000', time: new Date('2019-05-07T14:14:06Z'), hash:'0x00'},
  {block: 4340599, from: '0x1b8a1Cc23Aa6D8A882BaCf6d27546DF9305e0F13', to: '0x6A23B59ff43F82B761162DFc5b6F0F461210EC76', value: '10000000000000000', time: new Date('2019-05-07T14:14:06Z'), hash:'0x00'}
], '0x6A23B59ff43F82B761162DFc5b6F0F461210EC76');



// @return promise
function getToken() {
  return new Promise((resolve,reject) => {
    var endpoint = `${TOKEN_URL}?apikey=${API_KEY}`;
    console.log("getToken :: hitting endpoint " + endpoint);
    try {
      require("https").get(endpoint, (res) => {
        const { statusCode } = res;
        if (statusCode != 200) {          
          reject();
        } else {
          res.on('data', (data) => {
            TOKEN = data;
            console.log("getToken :: OK: " + TOKEN);
            resolve();
          })  
        }
      }).on('error', err => reject(err));
    } catch (err) {
      console.log("getToken :: error: " + err);
      reject(err);
    }
  });  
}

describe('smoke tests', () => {

  // initialization hook for every test
  before((done) => { 
    console.log("Settings: \n");
    OH_ETH_HOST && console.log('OH_ETH_HOST:'+OH_ETH_HOST);
    OH_ETH_PORT && console.log('OH_ETH_PORT:'+OH_ETH_PORT);
    TOKEN_URL && console.log('TOKEN_URL:'+TOKEN_URL);
    API_KEY && console.log('API_KEY:'+API_KEY);
    console.log("\n");

    (async () => {
      await getToken();
      done();
    })();
  });

  /**************/
  /* The tests. */
  /**************/

  it('validates a total of .03 eth was transferred from eth_acct1 to eth_acct2', (done) => {
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1+'/'+eth_acct2)
      .set({ "Authorization": `Bearer ${TOKEN}` })
      .then(function(res) {
        var reso = JSON.parse(res.text);
        assert.isTrue(reso.tally == (3 * POINT_0_1_ETH_IN_WEI));
        assert.isTrue(Array.isArray(reso.transactions));
        assert.isTrue(reso.transactions.length == 3);
        for (var tx of reso.transactions) {
          assert.isTrue(parseInt(tx["transaction-value"]) == POINT_0_1_ETH_IN_WEI);
          assert.isTrue((new Date(tx["transaction-date"])).getUTCFullYear() == '2019');
        }
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates .02 eth was transferred from eth_acct1 to eth_acct2 in the last 2 transactions', (done) => {
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1+'/'+eth_acct2+'?max-most-recent=2')
      .set({ "Authorization": `Bearer ${TOKEN}` })
      .then(function(res) {
        var reso = JSON.parse(res.text);
        assert.isTrue(reso.tally == (2 * POINT_0_1_ETH_IN_WEI));
        assert.isTrue(Array.isArray(reso.transactions));
        assert.isTrue(reso.transactions.length == 2);
        const txsShouldBeOlderThan = new Date('2018-11-25T00:00:00Z').getTime();
        for (var tx of reso.transactions) {
          assert.isTrue(parseInt(tx["transaction-value"]) == POINT_0_1_ETH_IN_WEI);
          assert.isTrue((new Date(tx["transaction-date"])).getTime() > txsShouldBeOlderThan);
        }
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates .02 eth was transferred in 2 transactions from eth_acct1 to eth_acct2 since 2019-05-07T14:18:00Z', (done) => {
    const sinceStr = '2019-05-07T14:18:00Z';
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1+'/'+eth_acct2+'?since='+sinceStr)
      .set({ "Authorization": `Bearer ${TOKEN}` })
      .then(function(res) {
        var reso = JSON.parse(res.text);
        assert.isTrue(reso.tally == (2 * POINT_0_1_ETH_IN_WEI));
        assert.isTrue(Array.isArray(reso.transactions));
        assert.isTrue(reso.transactions.length == 2);
        const txsShouldBeOlderThan = new Date(sinceStr).getTime();
        for (var tx of reso.transactions) {
          assert.isTrue(parseInt(tx["transaction-value"]) == POINT_0_1_ETH_IN_WEI);
          assert.isTrue((new Date(tx["transaction-date"])).getTime() > txsShouldBeOlderThan);
        }
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates .02 eth was transferred from eth_acct1 to eth_acct2 since 2019-05-07T14:18:00Z as tally only', (done) => {
    const sinceStr = '2019-05-07T14:18:00Z';
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1+'/'+eth_acct2+'?since='+sinceStr+'&tally-only=true')
      .set({ "Authorization": `Bearer ${TOKEN}` })
      .then(function(res) {
        var reso = JSON.parse(res.text);
        assert.isTrue(reso.tally == (2 * POINT_0_1_ETH_IN_WEI));
        assert.notExists(reso.transactions);
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });


  it('validates lowercase and uppercase addresses work', (done) => {
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1.toUpperCase()+'/'+eth_acct2.toLowerCase())
      .set({ "Authorization": `Bearer ${TOKEN}` })
      .then(function(res) {
        assert.isTrue(res.statusCode == 200);
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates skipping 0x at start of address causes 400', (done) => {
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1.substr(2)+'/'+eth_acct2)
      .set({ "Authorization": `Bearer ${TOKEN}` })
      .then(function(res) {
        assert.isTrue(res.statusCode == 400);
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates checking signature', (done) => {
    let message = eth.keccak256("testing stuff");
    let encodedMessage = Buffer.from(message).toString("base64");   
    let signature = eth.sign(eth_acct1_priv, message);
    let encodedSignature = Buffer.from(signature).toString("base64"); 
    
    /* 
      sending payload:
      
      {
        "signature": "MHg2YmM4MGJhMDRjYjg0MjI0ZDBkZjAyOTBkNjJhMTUzYmE2NmMwYTY3YWUyNmYxNzI2Y2E1M2JhYTJkNjU0MGU0NTQwZTFhODc0MDNkYTBiYWVjMmQ0YTFlZmY3ZDUzOGZkZmExNDZmZWQ4OTEwYzU0NTQ3M2VjNzYyYTEwNDhiNzFi",
        "message": "MzM2N2E0N2Y0OGNkNTk0OGU2OGVkNjQ5Zjc0ZDZmY2M2MDcyNWE4ODE1OTM1NDNhZTY0NmE5YjYzZjU1ZmUxOQ",
        "address": "0x046c88317b23dc57F6945Bf4140140f73c8FC80F"
      }    
    */
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .post('/is-signature-valid')
      .set({ "Authorization": `Bearer ${TOKEN}` })
      .send({
        signature: encodedSignature, // MHhhZTM5YmVkMmM1ZTUyMmMxNmJjMzQ3NGJlMGY1OWYxN2ZkNGNmNzY5MTNlMmZlMWJlZTk0ZTI3ZjJkNThiNWU1MzFiNjI5YjMwZmM0NzdjNjE1YzQ1ZDkyMzVjODA1ZDZlMjE0ZjIyOGE5MTI5ZmIyOWZmYzUxOGE0ZTE5OTc2OTFi
        message: encodedMessage, // MzM2N2E0N2Y0OGNkNTk0OGU2OGVkNjQ5Zjc0ZDZmY2M2MDcyNWE4ODE1OTM1NDNhZTY0NmE5YjYzZjU1ZmUxOQ
        address: eth_acct1 // 0x046c88317b23dc57F6945Bf4140140f73c8FC80F
      })
      .then(function(res) {
        assert.isTrue(res.statusCode == 200);
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('valid signature but address unused on blockchain returns 400', (done) => {
    const message = eth.keccak256("testing stuff");
    let msg = Buffer.from(message).toString("base64");
    let newIdentity = eth.createIdentity();

    let signed = eth.sign(newIdentity.privateKey, message);
    let sig = Buffer.from(signed).toString("base64");    
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .post('/is-signature-valid')
      .set({ "Authorization": `Bearer ${TOKEN}` })
      .send({
        signature: sig,
        message: msg,
        address: newIdentity.address
      })
      .then(function(res) {
        assert.isTrue(res.statusCode == 400);
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });
})

