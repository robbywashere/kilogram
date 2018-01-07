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
        return `${this.get('bucket')}/${this.get('uuid')}.${this.get('extension')}`
      }
    },
    deleted: {
      type: BOOLEAN,
      defaultValue: false
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
      defaultValue: true 
    },
    url: {
      type: TEXT,
    }
  },
  /* Scopes: {
    uploaded: true
  },*/
  Init({ Post }){
    this.belongsTo(Post);
  }, 
  StaticMethods: {
    srcStr: ({ bucket, uuid, extension })=> `${bucket}/${uuid}.${extension}`,
    setUploaded: function({ uuid }) {
      throw new Error('DEPRECATED after 2cd9c7a5b8f72d76a3615ed56c6b69205f1934a9');
    },
    setDeleted: function({ uuid }){
      return this.update({ deleted: true }, { where: { uuid }})
    },
  }
}


