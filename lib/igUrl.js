
const config = require('config');
const url = require('url');

module.exports = function IgUrl(username){
  let u = url.parse(config.get('IG_URL'));
  u.pathname = username;
  return u.format();
}
