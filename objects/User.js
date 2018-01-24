const sequelize = require('sequelize');
const crypto = require('crypto');
const { logger } = require('../lib/logger');
const hashify = require('../server-lib/auth/hashify');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get, isArray } = require('lodash');
const Promise = require('bluebird');

module.exports = {
  Name: 'User',
  Properties:{
    email: {
      type: STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
      //TODO: allow null false
    },
    password: {
      type: VIRTUAL,
      set: function(val){ this.setDataValue('passwordHash', hashify(this.passwordSalt, val)) }
    },
    passwordHash: {
      type: STRING,
      allowNull: false
    },
    passwordSalt: {
      type: STRING,
      defaultValue: ()=> crypto.randomBytes(16).toString('hex')
    },
    igPassword: {
      type: STRING
    },
    igUsername: {
      type: STRING
    },
    fooBar: {
      type: VIRTUAL,
    },
    superAdmin: {
      type: BOOLEAN,
      defaultValue: false
    },

  },
  AuthorizeInstance:{},
  Hooks: {
    afterCreate: async function(user, options){
      const { Account } = this.sequelize.models;
      if (!isArray(user.Accounts)) {
        try {
          logger.debug(`Account does not exist for UserId: ${user.id} - Creating ....`)
          const account = await Account.create();
          await account.addUserAs(user,'admin');
        } catch(e) {
          logger.error(`Could not create required Account for UserId: ${user.id} ... Aborting!\n ${e}`)
          throw e;
        }
      
      }
    },
  },
  PolicyScopes:{},
  Authorize: {},
  PolicyAttributes:{
    all: function(user){
      if (user.superAdmin) { return true }
      return ['id','email']
    }
  },
  PolicyAssert: true,
  ScopeFunctions: true, 
  Scopes: {
    superAdmins: { where: { superAdmin: true } },
  },
  Methods:{
    verifyPassword: function (password) { return (this.passwordHash === hashify(this.passwordSalt, password)) },
    isAccountRole: function(accountId, role){
      if (typeof this.Accounts === "undefined") {
        throw new Error('User record must include Account');
      }
      const vetter = (isArray(role)) ? role.includes.bind(role) : (x)=>(x===role);
      return this.Accounts.some(acc=>( vetter(get(acc,'UserAccount.role')) && get(acc,'id') === accountId) );
    }
  },
  StaticMethods: {
    //findByIdWithAccounts: function(id) { return  this.scope('withAccounts').findById(id) }
    findByIdWithAccounts: function (id) { return this.withAccountsForId(id) }
  },
  Init({ Post, IGAccount, UserRecovery, UserAccount, Account }){
    this.hasMany(UserRecovery);
    this.hasMany(Post);
    this.belongsToMany(Account, { through: 'UserAccount' });
    this.addScope('withAccounts', { include: [ { model: Account, include: [ { model: IGAccount } ] } ] });
    this.addScope('withAdminAccounts', { include: [ { model: Account, where: { '$Accounts.UserAccount.role$': 'admin'  }  } ] });
  },
}

