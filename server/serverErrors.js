const { logger } = require('../lib/logger');
const { get } = require('lodash');
const logServerErrors = (require('../controllers/lib/logServerErrors'))(logger.error);

module.exports = function (err, req, res, next) {
  err.status = (typeof get(err, 'status') !== 'undefined') ? err.status : 500;
  logServerErrors(err);
  res.status(err.status)
    .send(err);
};
