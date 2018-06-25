const sequelize = require('sequelize');
const SEQ = require('../db');

const {
  STRING, TEXT, DATE, INTEGER, VIRTUAL, BOOLEAN, UUIDV4, UUID, Op,
} = sequelize;
const { get, isUndefined } = require('lodash');
const uuidv4 = require('uuid/v4');
const config = require('config');
const minioObj = require('../server-lib/minio/minioObject');
const { superAdmin } = require('./_helpers');

module.exports = {
  Name: 'Photo',
  TableTriggers: [{
    after: 'INSERT',
  }],
  Properties: {
    objectName: {
      type: TEXT,
      allowNull: false,
      set(val) {
        this.dataValues.meta = minioObj.parse(val);
        return this.dataValues.objectName = val;
      },
    },
    uuid: {
      type: UUID,
      defaultValue: UUIDV4,
      unique: true,
    },
    meta: {
      type: sequelize.JSON,
    },
    src: {
      type: VIRTUAL,
      get() {
        return `${this.get('bucket')}/${this.get('objectName')}`;
      },
    },
    deleted: {
      type: BOOLEAN,
      defaultValue: false,
    },
    bucket: {
      type: STRING,
      defaultValue: config.get('MINIO_BUCKET')
    },
    uploaded: {
      type: BOOLEAN,
      defaultValue: true,
    },
    url: {
      type: TEXT,
    },
  },
  Hooks: {
    async beforeValidate(instance) { // TODO: --- beforeCreate??::dszddsadd
      const { uuid } = instance;
      if (isUndefined(instance.objectName)) {
        instance.set('objectName', minioObj.create('v4', { uuid }));
      }
    },
    async beforeCreate(instance) {
    }
  },
  Init({ Account }) {
    this.belongsTo(Account);
  },
  StaticMethods: {
    setDeleted(objectName) {
      //TODO: ACTUALLY DELETE?
      return this.update({ deleted: true }, { where: { objectName } });
    },
  },
};

