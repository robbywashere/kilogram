const sequelize = require('sequelize');
const crypto = require('crypto');

const {
  ENUM, STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;
const { isLoggedIn } = require('./_helpers');

// TODO unique true composite key constraint { AccountId, username }
//

const GOOD = 'GOOD',
  FAILED = 'FAILED',
  UNVERIFIED = 'UNVERIFIED';

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
      permit: false,
    },
    status: {
      type: ENUM(UNVERIFIED,GOOD,FAILED),
      defaultValue: UNVERIFIED,
      triggerable: true,
    },
  },
  Hooks: {
    async beforeUpdate(igAccount) {
      if (igAccount.password !== igAccount._previousDataValues.password) {
        igAccount.set('status',UNVERIFIED);
      }
    }, 
    async afterCreate({ id }) {
      const { VerifyIGJob, DownloadIGAvaJob } = this.sequelize.models;
      const igaccount = { IGAccountId: id };
      return Promise.all([
        VerifyIGJob.create(igaccount), 
        DownloadIGAvaJob.create(igaccount)
      ]);
    },
  },
  ScopeFunctions: true,
  Scopes: {
    verified: { where: { status: GOOD } },
  },
  Methods: {
    good(){
      return this.update({ status: GOOD })
    },
    fail(){
      return this.update({ status: FAILED })
    },
    unverify(){
      return this.update({ status: UNVERIFIED })
    },
  },
  StaticMethods: {
    get statusTypes() {
      return ({ GOOD, FAILED, UNVERIFIED });
    }
  },
  Init({ Photo }) {
     this.belongsTo(Photo,{ foreignKey: 'avatarUUID', targetKey: 'uuid' });
  },
};

