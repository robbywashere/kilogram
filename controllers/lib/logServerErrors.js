const { get } = require('lodash');

module.exports = function (logger) {
  return function (err) {
    if (get(err, 'status') === 500 || get(err, 'constructor.name') === 'ServerError') {
      logger(err);
    }
  };
};
