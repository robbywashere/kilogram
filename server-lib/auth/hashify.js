const crypto = require('crypto');

module.exports = function ({ password, salt }) {
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password.toString());
  return hash.digest('hex');
};
