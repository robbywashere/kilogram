const { Unauthorized } = require('http-errors');

function ensureLoggedIn(req, res, next){
  if (!!req.user){
    next(new Unauthorized());
  }
  next();
}

module.exports = { ensureLoggedIn }
