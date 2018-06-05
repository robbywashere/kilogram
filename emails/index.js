
const { get } = require('lodash');
const { slurpDir2, forExt, slurpFile } = require('../lib/slurpDir2');
const { join } = require('path');
const _ = require('lodash');
const pug = require('pug');

function compile(path) {
  const template = slurpFile(path);
  const name = get(path.split('/').slice(-1), 0);
  const key = get(name.split('.'), 0);
  return [key, pug.compile(template)];
}
module.exports = _.fromPairs(slurpDir2(__dirname, forExt('pug'))(compile));
