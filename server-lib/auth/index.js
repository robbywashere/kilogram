const passport = require('passport');

const { Strategy } = require('passport-local');

const { User, Account, IGAccount } = require('../../objects');

const config = require('config');

const DB = require('../../db');

const { get } = require('lodash');

const { Router } = require('express');

const { Forbidden } = require('http-errors');

const { logger } = require('../../lib/logger');

const { CookieSession, PGSession } = require('./session');


module.exports = function Auth(app, { appSecret = config.get('APP_SECRET'), sessionStrategy = CookieSession } = {}) {
  // TODO??: app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('body-parser').json());
  app.use(sessionStrategy.sessioner({ secret: appSecret }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new Strategy(async (username, password, cb) => {
    try {
      const user = await User.scope('withAccounts').findOne({ where: { email: username } });
      if (!user || !user.Accounts) { return cb(null, false); }
      if (!user.verifyPassword(password)) { return cb(null, false); }
      //   const Accounts = user.Accounts.map(A=>({ id : A.id, role: A.UserAccount.role }));
      // const id = user.id;
      //   cb(null, user);
      return cb(null, user);
    } catch (e) {
      return cb(e);
    }
  }));

  passport.serializeUser(sessionStrategy.serialize);
  passport.deserializeUser(sessionStrategy.deserialize);
  /* passport.serializeUser(function(user, cb) {
    cb(null, user.serialize());
  });

  passport.deserializeUser(function(user, cb) {
    try {
      if (!user || !user.Accounts) {
        throw new Error('Invalid User/User does not exist');
      }
      else {
        cb(null, user);
      }
    } catch(e) {
      logger.error(e);
      cb(null, false);
    }
  });
  */
  const router = new Router();


  router.get('/auth', (req, res, next) => {
    const user = req.user;
    if (!user) { return next(new Forbidden()); }
    res.send({ user });
  });
  router.post('/auth', passport.authenticate('local'), (req, res) => {
    // req.user.setPolicy('read', req.user);
    const user = req.user;
    // ???res.status(201);
    res.send({ user });
  });
  router.delete('/auth', (req, res) => {
    if (!req.user) return res.sendStatus(404);
    req.logout();
    res.sendStatus(200);
  });

  return router;
};
