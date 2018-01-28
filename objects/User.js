const sequelize = require('sequelize');
const crypto = require('crypto');
const { logger } = require('../lib/logger');
const hashify = require('../server-lib/auth/hashify');
const { STRING, JSON, DATE, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get, isArray } = require('lodash');
const Promise = require('bluebird');
const cryptoRandomString = require('crypto-random-string');
const { isLoggedIn, genPasswordKey, within24hrs } = require('./_helpers');

module.exports = {
  Name: 'User',
  Properties:{
    email: {
      type: STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordKey: {
      type: STRING,
      defaultValue: genPasswordKey 
    },
    refreshToken: {
      defaultValue: ()=> cryptoRandomString(32),
      type: STRING,
    },
    verified:{
      type: BOOLEAN,
      defaultValue: true,
    },
    password: {
      defaultValue: ()=> cryptoRandomString(32),
      type: VIRTUAL,
      set: function(val){ this.setDataValue('passwordHash', hashify(this.passwordSalt, val.toString())) }
    },
    passwordHash: {
      type: STRING,
    },
    passwordSalt: {
      type: STRING,
      defaultValue: cryptoRandomString(32) 
    },
    superAdmin: {
      type: BOOLEAN,
      defaultValue: false
    },

  },
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
  AuthorizeInstance:{
    read: true,
    list: true,
    delete: function(user){
      return user.superAdmin;
    },
    update: function(user){
      return user.superAdmin;
    },
    create: function(){
      return user.superAdmin
    }
  },
  PolicyScopes:{
    list: 'accountsScoped',
    // read: 'accountsScoped',
  },
  Authorize: {
    all: isLoggedIn
  },
  PolicyAttributes:{
    all: function(user){
      //if (user.superAdmin) { return true }
      return  ['id','email', 'createdAt', 'updatedAt', 'superAdmin' ] //TODO?
    }
  },
  PolicyAssert: true,
  ScopeFunctions: true, 
  Scopes: {
    superAdmins: { where: { superAdmin: true } },
    accountsScoped: function(user) {     
      const { Account } = this.sequelize.models;
      if (!get(user,'Accounts.length')) {
        throw new Error('User record must include Account');
      }
      return (user.superAdmin) ? {} :{  include: [ { model: Account,  where: { id: { [Op.in] : user.Accounts.map(a=>a.id) } } } ] } 

    } 
  },
  Methods:{
    verifyPassword: function (password) { return (this.passwordHash === hashify(this.passwordSalt, password.toString())) },
    isAccountRole: function(accountId, role){
      if (typeof this.Accounts === "undefined") {
        throw new Error('User record must include Account');
      }
      const vetter = (isArray(role)) ? role.includes.bind(role) : (x)=>(x===role);
      return this.Accounts.some(acc=>( vetter(get(acc,'UserAccount.role')) && get(acc,'id') === accountId) );
    }
  },
  StaticMethods: {
    recover: function({ email, password, passwordKey }) {
      return this.update({ passwordKey: genPasswordKey(), password: password.toString() },{ where: { passwordKey, email }, returning: true })
        .then(([_,u])=>u[0])
    },
    newRecovery: function(email) {
      return this.update({ passwordKey: genPasswordKey() }, { where: { email }, returning: true })
        .then(([_,u])=>u[0]);
    }
  },
  Init({ Post, IGAccount, UserAccount, Account }){
    this.hasMany(Post);
    this.belongsToMany(Account, { through: 'UserAccount' });
    this.addScope('withAccounts', { include: [ { model: Account, include: [ { model: IGAccount } ] } ] });
    this.addScope('withAdminAccounts', { include: [ { model: Account, where: { '$Accounts.UserAccount.role$': 'admin'  }  } ] });
  },
}

