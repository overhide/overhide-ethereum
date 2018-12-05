const eth_acct1 = '0x046c88317b23dc57F6945Bf4140140f73c8FC80F';
const eth_acct2 = '0xd6106c445A07a6A1caF02FC8050F1FDe30d7cE8b';
const POINT_0_1_ETH_IN_WEI = 10000000000000000;
const SAFETY_PREFIX_FOR_AUTH_NAMESPACE = "test_";

// Source properties from environment: must target same key-value store as target app, verified in 'before' hook with user login.
const OH_ETH_HOST = process.env.OH_ETH_HOST || process.env.npm_package_config_OH_ETH_HOST || 'localhost';
const OH_ETH_PORT = process.env.OH_ETH_PORT || process.env.npm_package_config_OH_ETH_PORT || 8080;
var KEYV_URI = process.env.KEYV_URI || process.env.npm_package_config_KEYV_URI;
const KEYV_AUTH_NAMESPACE = process.env.KEYV_AUTH_NAMESPACE || process.env.npm_package_config_KEYV_AUTH_NAMESPACE;
var USER = null;
var PASSWORD = null;

const chai = require('chai');
const chaiHttp = require('chai-http');
require('../../main/js/lib/log.js').init({app_name:'smoke'});
const crypto = require('../../main/js/lib/crypto.js').init();
const auth = require('../../main/js/lib/auth.js').init({keyv_uri: KEYV_URI,keyv_auth_namespace: KEYV_AUTH_NAMESPACE});
const eth = require('../../main/js/lib/eth-chain.js').init();
const uuid = require('uuid');
const assert = chai.assert;

chai.use(chaiHttp);

// Side effects: adds "authenticated" user to key-value store
// @return promise
function addUser() {
  USER = uuid();
  PASSWORD = uuid();
  return auth.updateUser(USER, PASSWORD);
}

// Side effects: removes "authenticated" user from key-value store 
// @return promise
function removeUser() {
  if (USER) {
    return auth.deleteUser(USER);
  }
  return Promise.resolve(null);
}

// @return promise
function verifyUserAuthenticated() {
  // hit an endpoint and make sure we don't get a 401
  return new Promise((resolve,reject) => {
    var endpoint = 'http://' + OH_ETH_HOST + ':' + OH_ETH_PORT + '/status.json';
    console.log("verifyUserAuthenticated :: hitting endpoint " + endpoint);
    try {
      require("http").get(endpoint, {auth:USER+":"+PASSWORD}, (res) => {
        const { statusCode } = res;
        if (statusCode != 200) {          
          reject();
        } else {
          res.on('data', (data) => {
            let resp = JSON.parse(data);
            if ('metrics' in resp
              && 'auth' in resp.metrics
              && 'authNamespaceHash' in resp.metrics.auth
              && resp.metrics.auth.authNamespaceHash == crypto.hash(KEYV_AUTH_NAMESPACE)) {
                resolve();
            } else {
              reject(`Namespace hash ${crypto.hash(KEYV_AUTH_NAMESPACE)} not found in payload: ${data}`);
            }
          })  
        }
      }).on('error', err => reject(err));
    } catch (err) {
      console.log("verifyUserAuthenticated :: error: " + err);
      reject(err);
    }
  });  
}

describe('smoke tests', () => {

  // initialization hook for every test
  before((done) => { 
    assert.isTrue (typeof KEYV_AUTH_NAMESPACE === "string" && KEYV_AUTH_NAMESPACE.startsWith(SAFETY_PREFIX_FOR_AUTH_NAMESPACE));  // testing should always be against 'test' namespace in key-value store
    assert.isTrue(KEYV_URI != null,"KEYV_URI must be specified: app metadata storage.");

    console.log("Settings: \n");
    OH_ETH_HOST && console.log('OH_ETH_HOST:'+OH_ETH_HOST);
    OH_ETH_PORT && console.log('OH_ETH_PORT:'+OH_ETH_PORT);
    KEYV_URI && console.log('KEYV_URI:'+KEYV_URI);
    console.log('KEYV_AUTH_NAMESPACE:'+KEYV_AUTH_NAMESPACE);
    console.log("\n");

    (async () => {
      console.log("before hook :: adding user");
      await addUser();
      console.log("before hook :: verifying user");
      await verifyUserAuthenticated();
      console.log("before hook :: verified authenticated");
      done();
    })();
  });

  // cleanup hook for every test
  after((done) => {
    (async () => {
      console.log("after hook :: removing user");
      removeUser();
      console.log("after hook :: removed user");
      done();
    })();
  });

  /**************/
  /* The tests. */
  /**************/

  it('401 returned for invalid user', (done) => {
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1+'/'+eth_acct2)
      .auth("fake","news")
      .then(function(res) {
        assert.isTrue(res.statusCode == 401);
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates a total of .03 eth was transferred from eth_acct1 to eth_acct2', (done) => {
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1+'/'+eth_acct2)
      .auth(USER,PASSWORD)
      .then(function(res) {
        var reso = JSON.parse(res.text);
        assert.isTrue(reso.tally == (3 * POINT_0_1_ETH_IN_WEI));
        assert.isTrue(Array.isArray(reso.transactions));
        assert.isTrue(reso.transactions.length == 3);
        for (var tx of reso.transactions) {
          assert.isTrue(parseInt(tx["transaction-value"]) == POINT_0_1_ETH_IN_WEI);
          assert.isTrue((new Date(tx["transaction-date"])).getUTCFullYear() == '2018');
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
      .auth(USER,PASSWORD)
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

  it('validates .02 eth was transferred in 2 transactions from eth_acct1 to eth_acct2 since 2018-11-25T00:00:00Z', (done) => {
    const sinceStr = '2018-11-25T00:00:00Z';
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1+'/'+eth_acct2+'?since='+sinceStr)
      .auth(USER,PASSWORD)
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

  it('validates .02 eth was transferred from eth_acct1 to eth_acct2 since 2018-11-25T00:00:00Z as tally only', (done) => {
    const sinceStr = '2018-11-25T00:00:00Z';
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+eth_acct1+'/'+eth_acct2+'?since='+sinceStr+'&tally-only=true')
      .auth(USER,PASSWORD)
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
      .auth(USER,PASSWORD)
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
      .auth(USER,PASSWORD)
      .then(function(res) {
        assert.isTrue(res.statusCode == 400);
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates checking signature', (done) => {
    const message = eth.keccak256("testing stuff");
    let msg = Buffer.from(message).toString("base64");

    // eth.sign("...", message);
    let signed = "0xae39bed2c5e522c16bc3474be0f59f17fd4cf76913e2fe1bee94e27f2d58b5e531b629b30fc477c615c45d9235c805d6e214f228a9129fb29ffc518a4e1997691b";    
    let sig = Buffer.from(signed).toString("base64");    
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .post('/is-signature-valid')
      .auth(USER,PASSWORD)
      .send({
        signature: sig,
        message: msg,
        address: eth_acct1
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
      .auth(USER,PASSWORD)
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

