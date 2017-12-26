const sequelize = require('sequelize');
const SEQ = require('../db');
const { STRING,  TEXT, DATE, INTEGER, VIRTUAL, BOOLEAN, UUIDV4, UUID, Op } = sequelize;
const { get } = require('lodash');
const uuidv4 = require('uuid/v4');

module.exports = {
  Name: 'Photo',
  Properties:{
    uuid: { 
      type: UUID,
      defaultValue: UUIDV4,
    },
    src: {
      type: VIRTUAL,
      get: function(){
        return `${this.get('uuid')}.${this.get('extension')}`
      }
    },
    bucket: {
      type: STRING,
      allowNull: false
    },
    extension: {
      type: STRING,
      allowNull: false
    },
    uploaded: {
      type: BOOLEAN,
      defaultValue: false
    },
    url: {
      type: TEXT,
    }
  },
  Associate(){
  }, 
  StaticMethods: {
    new: function({ bucket, extension }) {
      return this.create({
        bucket,
        extension,
      })
    }
  }
}

