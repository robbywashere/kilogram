const sequelize = require('sequelize');
const crypto = require('crypto');
const { STRING, BOOLEAN } = sequelize;

//TODO unique true composite key constraint { AccountId, username }
module.exports = {
  Name: 'IGAccount',
  Properties:{
    password: {
      type: STRING,
      allowNull: false,
      omit: true,
    },
    username: {
      type: STRING,
      allowNull: false,
      unique: 'igaccount_account'
    },
    verified: {
      type: BOOLEAN,
      defaultValue: false
    },
    active: {
      type: BOOLEAN,
      defaultValue: false
    }
  },
  Hooks: {
    //TODO: Before create incase of error abort?
    afterCreate: async function(instance){
       
    }
  }
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
  Init(){
  },
}

