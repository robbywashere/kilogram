const { Unauthorized } = require('http-errors');

module.exports = function (req, res, next) {
  if (!req.user) return next(new Unauthorized());
  next();
};
