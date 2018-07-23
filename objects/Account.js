const sequelize = require('sequelize');
const { get } = require('lodash');
const crypto = require('crypto');
const Haikunator = new (require('haikunator'))();

const {
  STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;
const Promise = require('bluebird');
const { isLoggedIn } = require('./_helpers');

module.exports = {
  Name: 'Account',
  Properties: {
    name: {
      type: STRING,
      defaultValue: Haikunator.haikunate.bind(Haikunator),
    },
    enabled: {
      type: BOOLEAN,
      defaultValue: true,
    },
  },
  Hooks: {},
  ScopeFunctions: true,
  Scopes: {
    userScoped(user) {
      const { User } = this.sequelize.models;
      return {
        where: { '$Users.UserAccount.UserId$': user.id },
        include: [{ model: User, through: { attributes: [] } }],
      };
    },
  },
  Methods: {
    addUserAs(user, role) {
      return this.addUser(user, { through: { role } });
    },
    async igAccountIds() {
      if (!this.IGAccounts) {
        await this.reloadWithIgAccounts();
      }
      return this.IGAccounts.map(iga => iga.id);
    },
  },
  StaticMethods: {},
  Init({ User, Account, IGAccount }) {
    this.belongsToMany(User, { through: 'UserAccount' });
    this.hasMany(IGAccount, {
      onDelete: 'cascade',
      foreignKey: { allowNull: false, unique: 'igaccount_account' },
    });
    this.addScope('withIgAccounts', { include: [IGAccount] });
    this.addScope('withUsers', { include: [User] });
  },
};
