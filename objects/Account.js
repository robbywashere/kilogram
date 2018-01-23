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
    update: function(){
      return (user.isAccountRole(this.id,"admin"))
    },
    delete: function(){
      return (user.isAccountRole(this.id,"admin"))
    }
  },
  Authorize: {
    write: function(user){
      user.admin //|| user.UserAccount 
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
  Init({ User, IGAccount }){
    this.belongsToMany(User,{ through: 'UserAccount' })
    this.hasMany(IGAccount)
    this.addScope('withIgAccount', { include: [ IGAccount ] })
  },
}

