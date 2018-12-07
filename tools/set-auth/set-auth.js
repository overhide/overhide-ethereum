'use strict';

const VALID_CHARS_USERNAME = /^[a-zA-Z0-9~!@#$%^&*_,.\-+=]{4,}$/g;
const VALID_CHARS_PASSWORD = /^[a-zA-Z0-9~!@#$%^&*_,.\-+=]{4,}$/g;

// CONFIGURATION CONSTANTS
const KEYV_URI = process.env.KEYV_URI || process.env.npm_package_config_KEYV_URI || null;
const KEYV_AUTH_NAMESPACE = process.env.KEYV_AUTH_NAMESPACE || process.env.npm_package_config_KEYV_AUTH_NAMESPACE || 'users';

const read = require('read');
const log = require('../../main/js/lib/log.js').init({app_name:'set-auth'}).fn('main');
require('../../main/js/lib/crypto.js').init(); // init dependency for auth
const auth = require('../../main/js/lib/auth.js').init({keyv_uri: KEYV_URI,keyv_auth_namespace: KEYV_AUTH_NAMESPACE});

/********/
/* MAIN */
/********/

console.log('Config:');
KEYV_URI && console.log(`KEYV_URI:${KEYV_URI}`);
console.log(`KEYV_AUTH_NAMESPACE:${KEYV_AUTH_NAMESPACE}`);
console.log('\n');

// CLI
if (process.argv.length > 2) {
  if (process.argv[2] == 'set'
      && process.argv.length == 5
      && process.argv[3].match(VALID_CHARS_USERNAME)
      && process.argv[4].match(VALID_CHARS_PASSWORD)) {
    (async () => {
      await auth.updateUser(process.argv[3],process.argv[4]);
      console.log(`resetting user: ${process.argv[3]}`);
      process.exit(0);
    })();      
    return;
  }
  if (process.argv[2] == 'unset'
      && process.argv.length == 4
      && process.argv[3].match(VALID_CHARS_USERNAME)) {
    (async () => {
      await auth.deleteUser(process.argv[3]);
      console.log(`unsetting user: ${process.argv[3]}`);
      process.exit(0);
    })();
    return;
  }
  console.log(`
  Usage:

  npm run set-auth set NAME PASSWORD
  npm run set-auth unset NAME

  NAME must match: ${VALID_CHARS_USERNAME}
  PASSWORD must match: ${VALID_CHARS_PASSWORD}
  `);
  process.exit(-1);
}

// INTERACTIVE
console.log('Interactive reset of authentication credentials for user (CTRL-C to abort)');
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
