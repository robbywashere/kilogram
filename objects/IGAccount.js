const sequelize = require('sequelize');
const crypto = require('crypto');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { isLoggedIn } = require('./_helpers');

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
      //permit: false,
    },
  },
  Hooks: {
    afterCreate: async function(IGAccount) {
      const { VerifyIGJob } = this.sequelize.models;
      return VerifyIGJob.create({
        IGAccount
      });
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

