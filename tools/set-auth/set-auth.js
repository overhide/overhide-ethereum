'use strict';

const VALID_CHARS_USERNAME = /^[a-zA-Z0-9~!@#$%^&*_,.\-+=]{4,}$/g;
const VALID_CHARS_PASSWORD = /^[a-zA-Z0-9~!@#$%^&*_,.\-+=]{4,}$/g;

// CONFIGURATION CONSTANTS
const KEYV_URI = tonull(process.env.KEYV_URI) || tonull(process.env.npm_package_config_KEYV_URI) || null;
const KEYV_AUTH_NAMESPACE = tonull(process.env.KEYV_AUTH_NAMESPACE) || tonull(process.env.npm_package_config_KEYV_AUTH_NAMESPACE) || 'users';

// @return [null] if 'what' is null even if a string containing 'null': process.env.npm_package* will be a 'null' string if 
//   set to null in package.json.
function tonull(what) { return (what == null || what == 'null') ? null : what; }

if (!KEYV_URI) throw new Error('KEYV_URI must be specified: app metadata storage.');
if (typeof KEYV_AUTH_NAMESPACE !== 'string' || KEYV_AUTH_NAMESPACE.length == 0) throw new Error('KEYV_AUTH_NAMESPACE must be set.');

const read = require('read');
const log = require('../../main/js/lib/log.js').init({app_name:'set-auth'}).fn('main');
require('../../main/js/lib/crypto.js').init(); // init dependency for auth
const auth = require('../../main/js/lib/auth.js').init({keyv_uri: KEYV_URI,keyv_auth_namespace: KEYV_AUTH_NAMESPACE});

/********/
/* MAIN */
/********/

console.log('Reset authentication credentials for user (CTRL-C to abort)');
console.log('\n');
KEYV_URI && console.log(`KEYV_URI:${KEYV_URI}`);
console.log(`KEYV_AUTH_NAMESPACE:${KEYV_AUTH_NAMESPACE}`);
console.log('\n');

var username_q = (resolve, reject) => {
  read({prompt:'username: '}, (error, answer, isDefault) => {
    if (answer.match(VALID_CHARS_USERNAME)) {
      resolve(answer);
    } else {
      reject('invalid input: please enter at least four valid characters (matching regexp ' + VALID_CHARS_USERNAME + ')\n\n');
    }
  });
};

var password_q = async (resolve, reject) => {
  read({prompt:'password (empty/ENTER to unset user): ',silent:true,replace:'*'}, (error, answer, isDefault) => {
    if (answer.length == 0 || answer.match(VALID_CHARS_PASSWORD)) {
      resolve(answer);
    }
    else {
      reject('invalid input: leave empty to unset user or enter at least four valid characters to set (matching regexp ' + VALID_CHARS_PASSWORD + ')\n\n');
    }
  });
};

(async () => {
  try {
    for(;;) {
      try {
        var username = await new Promise(username_q);
        break;
      } catch (msg) {
        log(msg);
      }
    };
    for(;;) {
      try {
        var password = await new Promise(password_q);
        break;
      } catch (msg) {
        log(msg);
      }
    };
  
    if (password.length == 0) {
      console.log(`unsetting user: ${username}`);
      await auth.deleteUser(username);
    } else {
      console.log(`resetting user: ${username}`);
      await auth.updateUser(username,password);
    }
  } catch (e) {
    log(e);
  }
  process.exit();  
})();
