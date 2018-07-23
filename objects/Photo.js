const sequelize = require('sequelize');
const SEQ = require('../db');

const {
  STRING, TEXT, DATE, INTEGER, VIRTUAL, BOOLEAN, UUIDV4, UUID, Op, ENUM,
} = sequelize;
const { get, isUndefined } = require('lodash');
const uuidv4 = require('uuid/v4');
const config = require('config');
const minioObj = require('../server-lib/minio/minioObject');
const { superAdmin } = require('./_helpers');

module.exports = {
  Name: 'Photo',
  TableTriggers: [
    {
      after: 'INSERT',
    },
  ],
  Properties: {
    objectName: {
      type: TEXT,
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
      type: STRING,
    },
    type: {
      type: ENUM('POST', 'IGAVATAR'),
      allowNull: false,
    },
    bucket: {
      type: STRING,
      defaultValue: config.get('MINIO_BUCKET'),
    },
    status: {
      type: ENUM('UNKNOWN', 'UPLOADED', 'DELETED'),
      defaultValue: 'UNKNOWN',
    },
    url: {
      type: TEXT,
    },
  },
  ScopeFunctions: true,
  Scopes: {
    avatar: { where: { type: 'IGAVATAR' } },
    postPhoto: { where: { type: 'POST' } },
    unknown: { where: { status: 'UNKNOWN' } },
    uploaded: { where: { status: 'UPLOADED' } },
    deleted: { where: { status: 'DELETED' } },
  },
  Hooks: {
    async beforeCreate(instance) {
      if (!instance.objectName) { instance.objectName = minioObj.create('v4', { uuid: instance.uuid }); }
      if (!instance.src) instance.src = `${instance.bucket}/${instance.objectName}`;
    },
  },
  Init({ Account, Post, PostJob }) {
    this.belongsTo(Account);
  },
  Methods: {},
  StaticMethods: {
    setUploaded({ uuid, bucket }) {
      return this.update(
        {
          bucket,
          status: 'UPLOADED',
        },
        { where: { uuid } },
      );
    },
    createPostPhoto({ ...args } = {}, ...rest) {
      return this.create({ ...args, type: 'POST' }, ...rest);
    },
    createAvaPhoto({ ...args } = {}, ...rest) {
      return this.create({ ...args, type: 'IGAVATAR' }, ...rest);
    },
    setDeleted(objectName) {
      // TODO: ACTUALLY DELETE?
      const { uuid } = minioObj.parse(objectName);
      return this.update({ status: 'DELETED' }, { where: { uuid } });
    },
  },
};
