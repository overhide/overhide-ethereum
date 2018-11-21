"use strict";

const keyv = require('keyv');
const readline = require('readline');
const hash = require('../../main/js/lib/hash.js');

const VALID_CHARS_USERNAME = /^[a-zA-Z0-9~!@#$%^&*_,.\-+=]{4,}$/g;
const VALID_CHARS_PASSWORD = /^[a-zA-Z0-9~!@#$%^&*_,.\-+=]{4,}$/g;

// CONFIGURATION CONSTANTS
const KEYV_URI = tonull(process.env.KEYV_URI) || tonull(process.env.npm_package_config_KEYV_URI) || null;
const KEYV_AUTH_NAMESPACE = tonull(process.env.KEYV_AUTH_NAMESPACE) || tonull(process.env.npm_package_config_KEYV_AUTH_NAMESPACE) || "users";

// @return [null] if 'what' is null even if a string containing "null": process.env.npm_package* will be a "null" string if 
//   set to null in package.json.
function tonull(what) { return (what == null || what == "null") ? null : what; }

if (!KEYV_URI) throw new Error("KEYV_URI must be specified: app metadata storage.");
if (typeof KEYV_AUTH_NAMESPACE !== 'string' || KEYV_AUTH_NAMESPACE.length == 0) throw new Error("KEYV_AUTH_NAMESPACE must be set.");

// @return A 'keyv' datastore instance for authenticated users
function getKeyvAuthUsers() {
  var keyv_uri = KEYV_URI;

  return new keyv({
    uri: typeof keyv_uri=== 'string' && keyv_uri,
    store: typeof keyv_uri !== 'string' && keyv_uri,
    namespace: KEYV_AUTH_NAMESPACE
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/********/
/* MAIN */
/********/

console.log('Reset authentication credentials for user (CTRL-C to abort)');
console.log('\n');
KEYV_URI && console.log('KEYV_URI:'+KEYV_URI);
console.log('KEYV_AUTH_NAMESPACE:'+KEYV_AUTH_NAMESPACE);
console.log('\n');

var username_q = (resolve, reject) => {
  rl.question('username: ', (answer) => {
    if (answer.match(VALID_CHARS_USERNAME)) {
      resolve(answer);
    } else {
      reject("invalid input: please enter at least four valid characters (matching regexp " + VALID_CHARS_USERNAME + ")\n\n");
    }
  });
};

var password_q = (resolve, reject) => {
  rl.question('password (empty/ENTER to unset user): ', (answer) => {
    if (answer.length == 0 || answer.match(VALID_CHARS_PASSWORD)) {
      resolve(answer);
    }
    else {
      reject("invalid input: leave empty to unset user or enter at least four valid characters to set (matching regexp " + VALID_CHARS_PASSWORD + ")\n\n");
    }
  });
};

(async () => {
  for(;;) {
    try {
      var username = await new Promise(username_q);
      break;
    } catch (msg) {
      console.log(msg);
    }
  };
  for(;;) {
    try {
      var password = await new Promise(password_q);
      break;
    } catch (msg) {
      console.log(msg);
    }
  };

  if (password.length == 0) {
    console.log("unsetting user: " + username);
    await getKeyvAuthUsers().delete(hash(username));
  } else {
    console.log("resetting user: " + username);
    await getKeyvAuthUsers().set(hash(username), hash(password));
  }
  rl.close();
  process.exit(0);
})();
