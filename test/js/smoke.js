const chai = require('chai');
const chaiHttp = require('chai-http');
const ethCrypto = require('eth-crypto');
const keyv = require('keyv');
const shajs = require('sha.js')
const uuid = require('uuid');
const assert = chai.assert;
const expect = chai.expect;

chai.use(chaiHttp);

const keth_acct1 = '0x046c88317b23dc57F6945Bf4140140f73c8FC80F';
const keth_acct2 = '0xd6106c445A07a6A1caF02FC8050F1FDe30d7cE8b';
const SAFETY_PREFIX_FOR_AUTH_NAMESPACE = "test_";

// Source properties from environment: must target same key-value store as target app, verified in 'before' hook with user login.
const OH_ETH_HOST = tonull(process.env.OH_ETH_HOST) || tonull(process.env.npm_package_config_OH_ETH_HOST) || 'localhost';
const OH_ETH_PORT = tonull(process.env.OH_ETH_PORT) || tonull(process.env.npm_package_config_OH_ETH_PORT) || 8080;
var KEYV_URI = tonull(process.env.KEYV_URI) || tonull(process.env.npm_package_config_KEYV_URI);
const KEYV_AUTH_NAMESPACE = tonull(process.env.KEYV_AUTH_NAMESPACE) || tonull(process.env.npm_package_config_KEYV_AUTH_NAMESPACE);
var USER = null;
var PASSWORD = null;

// @return [null] if 'what' is null even if a string containing "null": process.env.npm_package* will be a "null" string if 
//   set to null in package.json.
function tonull(what) { return (what == null || what == "null") ? null : what; }

// @return A 'keyv' datastore instance for authenticated users
function getKeyvAuthUsers() {
  var keyv_uri = KEYV_URI;

  return new keyv({
    uri: typeof keyv_uri=== 'string' && keyv_uri,
    store: typeof keyv_uri !== 'string' && keyv_uri,
    namespace: KEYV_AUTH_NAMESPACE
  });
}

// Side effects: adds "authenticated" user to key-value store
// @return promise
function addUser() {
  USER = uuid();
  PASSWORD = uuid();
  return getKeyvAuthUsers().set(USER, shajs("sha256").update(PASSWORD).digest("hex"));
}

// Side effects: removes "authenticated" user from key-value store 
// @return promise
function removeUser() {
  if (USER) {
    return getKeyvAuthUsers().delete(USER);
  }
  return Promise.resolve(null);
}

// @return promise
function verifyUserAuthenticated() {
  // hit an endpoint and make sure we don't get a 401
  return new Promise((resolve,reject) => {
    var endpoint = 'http://' + OH_ETH_HOST + ':' + OH_ETH_PORT + '/get-transactions/0/0';
    console.log("verifyUserAuthenticated :: hitting endpoint " + endpoint);
    try {
      require("http").get(endpoint, {auth:USER+":"+PASSWORD}, (res) => {
        const { statusCode } = res;
        if (statusCode != 401) resolve();
        else reject();
      });
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
      console.log("before hook :: added user");
      console.log("before hook :: retrieved user: " + await getKeyvAuthUsers().get(USER));
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
      .get('/get-transactions/'+keth_acct1+'/'+keth_acct2)
      .auth("fake","news")
      .then(function(res) {
        assert.isTrue(res.statusCode == 401);
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates some transfer of keth from keth_acct1 to keth_acct2', (done) => {
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+keth_acct1+'/'+keth_acct2)
      .auth(USER,PASSWORD)
      .then(function(res) {
        var reso = JSON.parse(res.text);
        assert.isTrue(Array.isArray(reso));
        assert.isTrue(reso.length > 0);
        assert.isTrue(parseInt(reso[0]["transaction-value"]) > 0);
        assert.isTrue(typeof reso[0]["transaction-date"] === 'string');
        done();
      })
      .catch(function(err) {
        throw err;
      });
  });

  it('validates lowercase and uppercase addresses work', (done) => {
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .get('/get-transactions/'+keth_acct1.toUpperCase()+'/'+keth_acct2.toLowerCase())
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
      .get('/get-transactions/'+keth_acct1.substr(2)+'/'+keth_acct2)
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
    const message = ethCrypto.hash.keccak256("testing stuff");
    let msg = Buffer.from(message).toString("base64");

    // ethCrypto.sign("...", message);
    let signed = "0xae39bed2c5e522c16bc3474be0f59f17fd4cf76913e2fe1bee94e27f2d58b5e531b629b30fc477c615c45d9235c805d6e214f228a9129fb29ffc518a4e1997691b";    
    let sig = Buffer.from(signed).toString("base64");    
    chai.request('http://' + OH_ETH_HOST + ':' + OH_ETH_PORT)
      .post('/is-signature-valid')
      .auth(USER,PASSWORD)
      .send({
        signature: sig,
        message: msg,
        address: keth_acct1
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
    const message = ethCrypto.hash.keccak256("testing stuff");
    let msg = Buffer.from(message).toString("base64");
    let newIdentity = ethCrypto.createIdentity();

    // ethCrypto.sign("...", message);
    let signed = ethCrypto.sign(newIdentity.privateKey, message);
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

