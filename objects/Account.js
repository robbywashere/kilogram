const sequelize = require('sequelize');
const crypto = require('crypto');
const hashify = require('../server-lib/auth/hashify');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const Promise = require('bluebird');

module.exports = {
  Name: 'Account',
  Properties:{
    name: {
      type: STRING
    },
    enabled: {
      type: BOOLEAN,
      defaultValue: true,
    }
  },
  Hooks: {
  },
  AuthorizeInstance: {
    all: function(user){
      return (user.isAccountRole(this.id,["admin", "member"]))
    },
    create: function(user){
      return (user.isAccountRole(this.id,"admin"))
    },
    update: function(user){
      return (user.isAccountRole(this.id,"admin"))
    },
    delete: function(user){
      return (user.isAccountRole(this.id,"admin"))
    }
  },
  Authorize: {
    write: function(user){
      return !!user.superAdmin
    }
  },
  AuthorizeInstance:{},
  PolicyScopes:{},
  PolicyAttributes:{},
  PolicyAssert: true,
  ScopeFunctions: true, 
  Scopes: {

  },
  Methods:{
    addUserAs: function(user,role){
      return this.addUser(user,{ through: { role }})
    }
  },
  StaticMethods: {
  },
  Init({ User, Account, IGAccount }){
    this.belongsToMany(User,{ through: 'UserAccount' })
    this.hasMany(IGAccount)
    this.hasMany(Account)
    this.addScope('withIgAccount', { include: [ IGAccount ] })
  },
}

