const config = require('config');
const urlJoin = require('url-join');

const base = config.get('BASE_URL');
module.exports = function (...paths) {
  return urlJoin(base, ...paths);
};
