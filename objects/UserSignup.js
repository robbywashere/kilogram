const sequelize = require('sequelize');
const crypto = require('crypto');
const hashify = require('../server-lib/auth/hashify');

const {
  STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;
const cryptoRandomString = require('crypto-random-string');

const createdAt = { [Op.gte]: sequelize.fn('NOW() - INTERVAL \'24 hours\' --') };

module.exports = {
  Name: 'UserSignup',
  Properties: {
    key: {
      type: STRING,
      defaultValue: () => cryptoRandomString(32),
    },
  },
  PolicyScopes: {},
  Authorize: {
    all(user) {
      return user.admin;
    },
  },
  PolicyAttributes: {},
  PolicyAssert: true,
  ScopeFunctions: true,
  Scopes: {
    forKey(key) { return { where: { key, createdAt }, include: [this.sequelize.models.User] }; },
  },
  AuthorizeInstance: {},
  Hooks: {
  },
  Methods: {
  },
  StaticMethods: {
  },
  Init({ User }) {
    this.belongsTo(User);
  },
};

