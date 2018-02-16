const sequelize = require('sequelize');
const SEQ = require('../db');
const { STRING,  TEXT, DATE, INTEGER, VIRTUAL, BOOLEAN, UUIDV4, UUID, Op } = sequelize;
const { get, isUndefined } = require('lodash');
const uuidv4 = require('uuid/v4');
const config = require('config');
const minioObj = require('../server-lib/minio/minioObject');
const { superAdmin } = require('./_helpers');

module.exports = {
  Name: 'Photo',
  PolicyAssert: false,
  Properties:{
    objectName: {
      type: TEXT,
      allowNull: false,
      set: function(val){
        this.dataValues.meta = minioObj.parse(val);
        return this.dataValues.objectName = val;
      }
    },
    uuid: {
      type: UUID,
      defaultValue: UUIDV4
    },
    meta: {
      type: sequelize.JSON,
    },
    src: {
      type: VIRTUAL,
      get: function(){
        return `${this.get('bucket')}/${this.get('objectName')}`
      }
    },
    deleted: {
      type: BOOLEAN,
      defaultValue: false
    },
    bucket: {
      type: STRING,
      defaultValue: config.MINIO_BUCKET

    },
    uploaded: {
      type: BOOLEAN,
      defaultValue: true 
    },
    url: {
      type: TEXT,
    }
  },
  Hooks: {
    beforeCreate: async function(instance){
      const { uuid } = instance;
      if (isUndefined(instance.objectName)) {
        instance.dataValues.objectName = minioObj.create('v2',{ uuid });
      }
    }
  },
  Init({ Account }){
    this.belongsTo(Account)
  }, 
  StaticMethods: {
    setDeleted: function(objectName){
      return this.update({ deleted: true }, { where: { objectName }})
    },
  }
}


