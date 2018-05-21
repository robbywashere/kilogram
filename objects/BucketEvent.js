const sequelize = require('sequelize');
const SEQ = require('../db');
const { STRING, DATE, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');

/*Triggers: [
    {
      after: ['INSERT'],
      columns: '*',
      channel: 'igaccount_status'
      fn: function(OLD,NEW){
        if (NEW.value.Records[0].eventName === "s3:ObjectCreated:Put") {
          UUID = NEW.key.split('/')[1].split('.')[0];
          if (UUID) plv8.execute( 'UPDATE "Photos" SET uploaded=true WHERE UUID=$1', [ UUID ] );
        }
      }
    }
  ],*/

module.exports = {
  Name: 'BucketEvents',
  TableName: 'bucketevents',
  PolicyAssert: false,
  Properties:{
    key: { 
      type: STRING,
      unique: true
    },
    value: {
      type: sequelize.JSON
    },
    createdAt: {
      type: DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    updatedAt: {
      type: DATE,
      defaultValue: sequelize.literal('NOW()'),
    }
  },
  AuthorizeInstance:{},
  Init(){
  }, 
  StaticMethods: {
  }
}


