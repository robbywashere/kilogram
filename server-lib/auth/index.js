const passport = require('passport');

const { Strategy } = require('passport-local');

const { User, Account, IGAccount } = require('objects');

const config = require('config');


module.exports = function Auth(app) {


  app.use(require('cookie-parser')());
  // TODO: app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('body-parser').json());
  app.use(require('express-session')({ 
    secret: config.APP_SECRET, 
    resave: true, 
    saveUninitialized: true 
  }));

  passport.use(new Strategy(
    async (username, password, cb) => {
      try {
        const user = await User.findOne({ where: { username } });
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
      const user = await User.findByIdWithAccounts(id);
      cb(null, user);
    } catch(e) {
      return cb(e);
    }

  });

  app.use(passport.initialize());
  app.use(passport.session());

  const login = passport.authenticate('local');
  const logout = (req,res) => req.logout();

  return {
    login,
    logout
  }


}
