const sequelize = require('sequelize');
const crypto = require('crypto');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

module.exports = {
  Name: 'IGAccount',
  Properties:{
    igPassword: {
      type: STRING
    },
    igUsername: {
      type: STRING
    },
  },
  PolicyScopes:{},
  Authorize: {},
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

