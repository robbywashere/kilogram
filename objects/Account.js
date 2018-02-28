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
  ScopeFunctions: true, 
  Scopes: {
    // withIGAccounts: { include: [ this.sequelize.models.IGAccount ] },
    userScoped: function(user){
      if (!get(user,'Accounts.length')) {
        throw new Error('User record must include Account');
      }
      return { where: { id: { [Op.in]: user.Accounts.map(a=>a.id) } }}
    }
  },
  Methods:{
    addUserAs: function(user,role){
      return this.addUser(user,{ through: { role }})
    },
    igAccountIds: async function(){
      if (!this.IGAccounts) { await this.reloadWithIgAccounts() }
      return this.IGAccounts.map(iga=>iga.id)
    }

  },
  StaticMethods: {
  },
  Init({ User, Account, IGAccount }){
    this.belongsToMany(User,{ through: 'UserAccount' })
    this.hasMany(IGAccount, { foreignKey: { allowNull: false, unique: 'igaccount_account' }})
    this.addScope('withIgAccounts', { include: [ IGAccount ] })
    this.addScope('withUsers', { include: [ User ] })
  },
}

