const sequelize = require('sequelize');
const SEQ = require('../db');

const {
  STRING, DATE, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;
const { get } = require('lodash');

module.exports = {
  Name: 'BucketEvents',
  TableName: 'bucketevents',
  TableTriggers: [
    {
      after: 'INSERT',
    },
  ],
  Properties: {
    key: {
      type: STRING,
      unique: true,
    },
    value: {
      type: sequelize.JSON,
    },
    createdAt: {
      type: DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    updatedAt: {
      type: DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
  },
  AuthorizeInstance: {},
  Init() {},
  StaticMethods: {},
};
