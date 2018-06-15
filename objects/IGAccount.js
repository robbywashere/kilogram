const sequelize = require('sequelize');
const crypto = require('crypto');

const {
  ENUM, STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;
const { isLoggedIn } = require('./_helpers');

// TODO unique true composite key constraint { AccountId, username }
//


module.exports = {
  Name: 'IGAccount',
  Properties: {
    password: {
      type: STRING,
      allowNull: false,
      omit: true,
    },
    username: {
      type: STRING,
      allowNull: false,
      unique: 'igaccount_account',
      // permit: false,
    },
    status: {
      type: ENUM('UNVERIFIED', 'GOOD', 'FAILED'),
      defaultValue: 'UNVERIFIED',
      triggerable: true,
    },
  },
  Hooks: {
    /* TODO: async afterUpdate() {
     * if username !== previous.username ||
          password !== previous.password
          this.status = 'UNVERIFIED'
          VerifyIGJob.create()
    } */
    async afterCreate({ id }) {
      const { VerifyIGJob } = this.sequelize.models;
      return VerifyIGJob.create({
        IGAccountId: id,
      });
    },
  },
  Scopes: {
    verified: { where: { status: 'GOOD' } },
  },
  Methods: {
  },
  StaticMethods: {
  },
  Init() {
  },
};

