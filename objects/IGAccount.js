const sequelize = require('sequelize');
const crypto = require('crypto');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

module.exports = {
  Name: 'IGAccount',
  Properties:{
    password: {
      type: STRING
    },
    username: {
      type: STRING
    },
  },
  PolicyScopes:{},
  Authorize: {
    
  },
  AuthorizeInstance:{},
  PolicyAttributes:{},
  PolicyAssert: true,
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
  Init(){
  },
}

