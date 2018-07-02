const { logger } = require('../lib/logger');

module.exports = function (p) {
  return p.then(() => { logger('~ Finish'); process.exit(0); }).catch((e) => { logger.error(e); process.exit(1); });
};
