const session = require('express-session');
const cookieSession = require('cookie-session');
const { logger } = require('../../lib/logger');
const { User } = require('../../objects');
const demand = require('../../lib/demand');
const pgSession = require('connect-pg-simple')(session);
const config = require('config');
const pgConnectConfig = require('../../db/config')[config.get('NODE_ENV')];


class PGSessionClass {
  constructor({ secret = demand('PGSessionClass requires { secret: <String> } ') } = {}) {
    this.secret = secret;
  }
  get sessioner() {
    if (typeof this._sessioner === 'undefined') {
      return this.init();
    }
    return this._sessioner;
  }

  init({ secret = this.secret } = {}) {
    this._sessioner = session({
      store: new pgSession({
        conObject: pgConnectConfig 
      }),
      secret,
      resave: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      saveUninitialized: true,
    });
    return this._sessioner;
  }

  serialize(user, cb) {
    cb(null,user.id);
  }

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
  }
}


class CookieSessionClass {
  constructor({ secret = demand('CookieSessionClass requires { secret: <String> } ') }) {
    this.secret = secret;
  }

  get sessioner() {
    if (typeof this._sessioner === 'undefined') {
      return this.init();
    }
    return this._sessioner;
  }
  init({ secret = this.secret } = {}) {
    this._sessioner = new cookieSession({
      name: 'session',
      secret,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    return this._sessioner;
  }

  serialize(user, cb) { return cb(null, user.serialize()); }

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
  }
}


module.exports = { CookieSessionClass, PGSessionClass };
