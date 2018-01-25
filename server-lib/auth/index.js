const passport = require('passport');

const { Strategy } = require('passport-local');

const { User, Account, IGAccount } = require('../../objects');

const config = require('config');

const DB = require('../../db');

const { get } = require('lodash');

const { Router } = require('express');

const session = require('express-session');

const pgSession = require('connect-pg-simple')(session);


module.exports = function Auth(app) {


  // TODO: app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('body-parser').json());
  app.use(require('cookie-parser')());




  //TODO: replace with JWT
  if (config.NODE_ENV === "development" ||
    config.NODE_ENV === "production"
  ) {
    app.use(session({
      store: new pgSession({
        //pool: DB.connectionManager.pool
        conObject: require('../../db/config')[config.NODE_ENV]
        //pgPromise: DB.connectionManager.pool._Promise
      }),
      secret: config.APP_SECRET, 
      resave: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
      saveUninitialized:true,
      //cookie: {},
    }));
  }
  else {
    app.use(session({ 
      secret: config.APP_SECRET, 
      cookie: {},
      resave: true, 
      saveUninitialized: true 
    }));
  }

  if (config.NODE_ENV === 'production') {
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
      if (!user) throw new Error('Invalid User');
      user.setPolicy('read', user);
      cb(null, user);
    } catch(e) {
      return cb(e);
    }

  });

  const router = new Router();

  router.post('/auth',passport.authenticate('local'), function(req, res){
    req.user.setPolicy('read', req.user);
    const user = req.user;
    res.send({ user });
  })
  router.delete('/auth', (req,res) => {
    req.logout();
    res.sendStatus(200);
  })

  return router;


}
