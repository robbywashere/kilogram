const sequelize = require('sequelize');
const { get } = require('lodash');
const crypto = require('crypto');
const hashify = require('../server-lib/auth/hashify');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const Promise = require('bluebird');
const { isLoggedIn } = require('./_helpers');

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
      return !!user.superAdmin
    },
    create: function(user){
      return (user.isAccountRole(this.id,"admin"))
    },
    update: function(user){
      return (user.isAccountRole(this.id,"admin"))
    },
    delete: function(user){
      return (user.isAccountRole(this.id,"admin"))
    },
    read: function(user){
      return (user.isAccountRole(this.id,["member","admin"]))
    },
    list: function(user){
      return (user.isAccountRole(this.id,["member","admin"]))
    }
  },
  Authorize: {
    all: isLoggedIn
  },
  PolicyScopes:{
    all: 'userScoped',
  },
  PolicyAttributes:{
    all: function(user){
      if (!!user.superAdmin) return ['name', 'enabled','id','Users','createdAt','updatedAt','IGAccounts']
      else {
        return []
      }
    
    }
  },
  PolicyAssert: true,
  ScopeFunctions: true, 
  Scopes: {
    userScoped: function(user){
      if (!get(user,'Accounts.length')) {
        throw new Error('User record must include Account');
      }
      return (user.superAdmin) ? {} : { where: { id: { [Op.in]: user.Accounts.map(a=>a.id) } }}
    }
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
    this.addScope('withIgAccounts', { include: [ IGAccount ] })
    this.addScope('withUsers', { include: [ User ] })
  },
}

