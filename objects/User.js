const sequelize = require('sequelize');
const crypto = require('crypto');
const { logger } = require('../lib/logger');
const hashify = require('../server-lib/auth/hashify');

const {
  STRING, JSON, DATE, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;
const {
  pick, get, isUndefined, isArray,
} = require('lodash');
const Promise = require('bluebird');
const cryptoRandomString = require('crypto-random-string');
const { genPasswordKey, randomKey } = require('./_helpers');

module.exports = {
  Name: 'User',
  Properties: {
    email: {
      type: STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    verifyKey: {
      type: STRING,
      defaultValue: randomKey,
      omit: true,
    },
    passwordKey: {
      type: STRING,
      defaultValue: genPasswordKey,
      omit: true,
    },
    refreshToken: {
      defaultValue: randomKey,
      type: STRING,
      omit: true,
    },
    verified: {
      type: BOOLEAN,
      defaultValue: true,
      omit: true,
    },
    password: {
      defaultValue: randomKey,
      type: VIRTUAL,
      omit: true,
      set(password) {
        const salt = randomKey();
        this.setDataValue('passwordSalt', salt);
        this.setDataValue('passwordHash', hashify({ salt, password }));
      },
    },
    passwordHash: {
      type: STRING,
      omit: true,
    },
    passwordSalt: {
      type: STRING,
      omit: true,
    },
    superAdmin: {
      type: BOOLEAN,
      defaultValue: false,
      omit: true,
    },

  },
  Hooks: {
    // beforeCreate: function(){}
    async afterCreate(user, options) {
      const { Account } = this.sequelize.models;
      if (!isArray(user.Accounts)) {
        try {
          const account = await Account.create();
          await account.addUserAs(user, 'admin');
        } catch (e) {
          logger.error(`Could not create required Account for UserId: ${user.id} ... Aborting!\n ${e}`);
          throw e;
        }
      }
    },
  },
  ScopeFunctions: true,
  Scopes: {
    superAdmins: { where: { superAdmin: true } },
    accountsScoped(user) {
      const { Account } = this.sequelize.models;
      if (!get(user, 'Accounts.length')) {
        throw new Error('User record must include Account');
      }
      return { include: [{ model: Account, where: { id: { [Op.in]: user.Accounts.map(a => a.id) } } }] };
    },
  },
  Methods: {

    igAccountIds() {
      try {
        const [igAccountIds] = this.Accounts.map(a => a.IGAccounts.map(iga => iga.id));
        return igAccountIds;
      } catch (e) {
        return [];
      }
    },
    accountIds() {
      try {
        return this.Accounts.map(A => A.id);
      } catch (e) {
        return [];
      }
    },
    verifyPassword(password) { return (this.passwordHash === hashify({ salt: this.passwordSalt, password })); },
    async isAccountRole(accountId, role) {
      try {
        if (!get(this, 'Accounts.length') || isUndefined(this.Accounts[0].UserAccount)) {
          await this.reloadWithAccounts();
        }
        const vetter = (isArray(role)) ? role.includes.bind(role) : x => (x === role);
        return this.Accounts.some(acc => (vetter(get(acc, 'UserAccount.role')) && get(acc, 'id') === accountId));
      } catch (e) {
        return false;
      }
    },
  },
  StaticMethods: {
    recover({ email, password, passwordKey }) {
      return this.update({ passwordKey: genPasswordKey(), password }, { where: { passwordKey, email }, returning: true })
        .then(([_, u]) => u[0]);
    },
    newRecovery(email) {
      return this.update({ passwordKey: genPasswordKey() }, { where: { email }, returning: true })
        .then(([_, u]) => u[0]);
    },
  },
  Init({
    Post, IGAccount, UserAccount, Account,
  }) {
    this.hasMany(Post);
    this.belongsToMany(Account, { through: 'UserAccount' });
    this.addScope('withAccounts', { include: [{ model: Account, include: [IGAccount] }] });
    this.addScope('withAdminAccounts', { include: [{ model: Account, where: { '$Accounts.UserAccount.role$': 'admin' } }] });
  },
};

