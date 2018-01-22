const sequelize = require('sequelize');
const crypto = require('crypto');
const hashify = require('../server-lib/auth/hashify');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
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
    //withAccounts: { include: [ { model: 'Account', include: [ { model: 'IGAccount' } ] } ] }
  },
  Methods:{
    verifyPassword: function (password) { return (this.passwordHash === hashify(this.passwordSalt, password)) },
    findByIdWithAccounts: function(id) { return this.findById(id, { include: [ { model: 'Account', include: [ { model: 'IGAccount' } ] } ] }) }
  },
  StaticMethods: {
  },
  Init({ Post, IGAccount, UserRecovery, Account }){
    this.hasMany(UserRecovery);
    this.hasMany(Post);
    this.belongsToMany(Account, { through: 'UserAccount' });
    this.addScope('withAccounts', { include: [ { model: Account, include: [ { model: IGAccount } ] } ] });
  },
}

