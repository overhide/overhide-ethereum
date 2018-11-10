const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;

chai.use(chaiHttp);

const keth_acct1 = '0x046c88317b23dc57F6945Bf4140140f73c8FC80F';
const keth_acct2 = '0xd6106c445A07a6A1caF02FC8050F1FDe30d7cE8b';

it('validates some transfer of keth from keth_acct1 to keth_acct2', function(done) {
  chai.request('http://localhost:8080')
    .get('/get-transactions/'+keth_acct1+'/'+keth_acct2)
    .then(function(res) {
      var reso = JSON.parse(res.text);
      assert.typeOf(reso.fromAddressWas, 'string');
      done();
    })
    .catch(function(err) {
      throw err;
    });
});

