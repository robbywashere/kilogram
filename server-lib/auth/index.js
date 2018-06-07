const passport = require('passport');

const { Strategy } = require('passport-local');

const { User, Account, IGAccount } = require('../../objects');

const config = require('config');

const DB = require('../../db');

const demand = require('../../lib/demand');

const { get } = require('lodash');

const { Router } = require('express');

const { Forbidden } = require('http-errors');

const { logger } = require('../../lib/logger');

const { CookieSession, PGSession } = require('./session');

//TODO: dep inj initialized sessioner({ secret })

module.exports = function Auth(app, { sessionStrategy = demand('sessionStrategy') }) {
  // TODO??: app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('body-parser').json());
  app.use(sessionStrategy.sessioner);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new Strategy(async (username, password, cb) => {
    try {
      const user = await User.scope('withAccounts').findOne({ where: { email: username } });
      if (!user || !user.Accounts) { return cb(null, false); }
      if (!user.verifyPassword(password)) { return cb(null, false); }
      return cb(null, user);
    } catch (e) {
      return cb(e);
    }
  }));

  passport.serializeUser(sessionStrategy.serialize);
  passport.deserializeUser(sessionStrategy.deserialize);
  const router = new Router();
  router.get('/auth', (req, res, next) => {
    const user = req.user;
    if (!user) { return next(new Forbidden()); }
    res.send({ user });
  });
  router.post('/auth', passport.authenticate('local'), (req, res) => {
    const user = req.user;
    res.send({ user });
  });
  router.delete('/auth', (req, res) => {
    if (!req.user) return res.sendStatus(404);
    req.logout();
    res.sendStatus(200);
  });

  return router;
};
