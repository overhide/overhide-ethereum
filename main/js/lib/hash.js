"use strict";

const shajs = require('sha.js')

// @return hashed valued
function hash(what) {
  return shajs("sha256").update(what).digest("hex");
}

module.exports = hash;