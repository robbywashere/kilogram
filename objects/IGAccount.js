const sequelize = require('sequelize');
const crypto = require('crypto');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { isLoggedIn } = require('./_helpers');

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
    all: isLoggedIn
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

