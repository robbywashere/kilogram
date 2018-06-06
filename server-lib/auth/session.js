const session = require('express-session');
const cookieSession = require('cookie-session');
const { logger } = require('../../lib/logger');
const { User } = require('../../objects');
const demand = require('../../lib/demand');
const pgSession = require('connect-pg-simple')(session);
const config = require('config');

const PGSession = {
  sessioner({ secret = demand('PGSession requires { secret: <String> } ') }) {
    return session({
      store: new pgSession({
        conObject: require('../../db/config')[config.get('NODE_ENV')],
      }),
      secret,
      resave: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      saveUninitialized: true,
    });
  },
  serialize(user, cb) {
    cb(null, user.id);
  },

  async deserialize(id, cb) {
    try {
      const user = await User.withAccountsForId(id);
      if (!user) throw new Error('Invalid User/User does not exist');
      else {
        cb(null, user);
      }
    } catch (e) {
      logger.error(e);
      cb(null, false);
    }
  },
};

const CookieSession = {
  sessioner({ secret = demand('CookieSession requires { secret: <String> } ') }) {
    return cookieSession({
      name: 'session',
      secret,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  },
  serialize(user, cb) { return cb(null, user.serialize()); },
  async deserialize({ id }, cb) {
    try {
      const user = await User.withAccountsForId(id);
      if (!user) throw new Error('Invalid User/User does not exist');
      else {
        cb(null, user);
      }
    } catch (e) {
      logger.error(e);
      cb(null, false);
    }
  },
};

module.exports = { CookieSession, PGSession };
