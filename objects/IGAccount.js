const sequelize = require('sequelize');
const crypto = require('crypto');
const { ENUM, STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
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
    status: {
      type: ENUM('unverified','verified','failed'),
      defaultValue: 'unverified',
      validate: {
          isIn: [['unverified','verified','failed']]
      }
    }
  },
  Hooks: {
    afterCreate: async function({ id }) {
      const { VerifyIGJob } = this.sequelize.models;
      return VerifyIGJob.create({
        IGAccountId: id
      });
    }
  },
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
  Init(){
  },
}


