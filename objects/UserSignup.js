const sequelize = require('sequelize');
const crypto = require('crypto');

const {
  STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;
const cryptoRandomString = require('crypto-random-string');

const createdAt = { [Op.gte]: sequelize.fn("NOW() - INTERVAL '24 hours' --") };

module.exports = {
  Name: 'UserSignup',
  Properties: {
    key: {
      type: STRING,
      defaultValue: () => cryptoRandomString(32),
    },
  },
  ScopeFunctions: true,
  Scopes: {
    forKey(key) {
      return { where: { key, createdAt }, include: [this.sequelize.models.User] };
    },
  },
  Init({ User }) {
    this.belongsTo(User);
  },
};
