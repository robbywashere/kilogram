const sequelize = require('sequelize');
const crypto = require('crypto');
const hashify = require('../server-lib/auth/hashify');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op, ENUM } = sequelize;

const Promise = require('bluebird');

module.exports = {
  Name: 'UserAccount',
  Properties:{
    role: {
      type: ENUM('member','admin'),
      allowNull: false,
      validate: {
          isIn: [['member', 'admin']]
      }
    }
  },
  Hooks: {
  },
  PolicyScopes:{},
  Authorize: {},
  PolicyAttributes:{},
  PolicyAssert: true,
  ScopeFunctions: true, 
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
     
  },
  Init(){
  },
}

