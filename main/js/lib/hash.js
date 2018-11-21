"use strict";

const crypto = require('crypto')

// @return hashed valued
function hash(what) {
  return crypto.createHash('sha256').update(what).digest("hex");
}

module.exports = hash;