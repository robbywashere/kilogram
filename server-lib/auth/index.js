const passport = require('passport');

const { Strategy } = require('passport-local');

const { User, Account, IGAccount } = require('../../objects');

const config = require('config');

const DB = require('../../db');

const { get } = require('lodash');

const { Router } = require('express');

const session = require('express-session');

const pgSession = require('connect-pg-simple')(session);

const { Forbidden } = require('http-errors');

const { logger } = require('../../lib/logger');


module.exports = function Auth(app) {


  // TODO: app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('body-parser').json());
  app.use(require('cookie-parser')());



    app.use(session({
      store: new pgSession({
        //pool: DB.connectionManager.pool
        conObject: require('../../db/config')[config.get('NODE_ENV')]
        //pgPromise: DB.connectionManager.pool._Promise
      }),
      secret: config.get('APP_SECRET'), 
      resave: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
      saveUninitialized:true,
      //cookie: {},
    }));

  if (config.get('NODE_ENV') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
  }

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new Strategy(
    async (username, password, cb) => {
      try {
        const user = await User.findOne({ where: { email: username } });
        if (!user) { return cb(null, false); }
        if (!user.verifyPassword(password)) { return cb(null, false); }
        return cb(null, user);
      } catch(e){
        return cb(e);
      }
    }));

  passport.serializeUser(function(user, cb) {
    cb(null, user.id);
  });

  passport.deserializeUser(async function(id, cb) {
    try {
      const user = await User.withAccountsForId(id);
      if (!user) throw new Error('Invalid User/User does not exist');
      else {
        //user.setPolicy('read', user);
        cb(null, user);
      }
    } catch(e) {
      logger.error(e);
      cb(null, false);
    }

  });

  const router = new Router();


  router.get('/auth',function(req, res, next){
    const user = req.user;
    if (!user) { return next(new Forbidden()) }
    res.send({ user: user.serialize() });
  });
  router.post('/auth',passport.authenticate('local'), function(req, res){
    //req.user.setPolicy('read', req.user);
    const user = req.user;
    //???res.status(201);
    res.send({ user });
  });
  router.delete('/auth', (req,res) => {
    req.logout();
    res.sendStatus(200);
  })

  return router;


}
