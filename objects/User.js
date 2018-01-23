const sequelize = require('sequelize');
const crypto = require('crypto');
const hashify = require('../server-lib/auth/hashify');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get, isArray } = require('lodash');
const Promise = require('bluebird');

module.exports = {
  Name: 'User',
  Properties:{
    email: {
      type: STRING,
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
    admin: {
      type: BOOLEAN,
      defaultValue: false
    },

  },
  AuthorizeInstance:{},
  Hooks: {
  },
  PolicyScopes:{},
  Authorize: {},
  PolicyAttributes:{},
  PolicyAssert: true,
  ScopeFunctions: true, 
  Scopes: {
    admins: { where: { admin: true } },
    fooBar: { where: { fooBar: true }},
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

