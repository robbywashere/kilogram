const sequelize = require('sequelize');
const crypto = require('crypto');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

module.exports = {
  Name: 'IGAccount',
  Properties:{
    igPassword: {
      type: STRING
    },
    igAccountname: {
      type: STRING
    },
  },
  PolicyAssert: false,
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
  Init({ User }){
    this.belongsToMany(User,{ through: 'UserIGAccount' })
  },
}

