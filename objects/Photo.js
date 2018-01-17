const sequelize = require('sequelize');
const SEQ = require('../db');
const { STRING,  TEXT, DATE, INTEGER, VIRTUAL, BOOLEAN, UUIDV4, UUID, Op } = sequelize;
const { get } = require('lodash');
const uuidv4 = require('uuid/v4');
const minioObj = require('../server-lib/minio/minioObject');

module.exports = {
  Name: 'Photo',
  Properties:{
    objectName: {
      type: TEXT,
      allowNull: false
    },
    meta: {
      type: VIRTUAL,
      get: function(){
        try {
          return minioObj.parse(this.get('objectName'));
        } catch(e){
          return undefined // TODO? 
        }
      }
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
  Policy: {
    show: {
      attr: function (user, photo)  {
        if (user && user.isAdmin) return true
        return ['id','src', 'objectName','bucket'] 
      }
    }
  },
  /* Scopes: {
    uploaded: true
  },*/
  Init({ Post }){
    this.belongsTo(Post);
  }, 
  StaticMethods: {
    setUploaded: function({ uuid }) {
      throw new Error('DEPRECATED after 2cd9c7a5b8f72d76a3615ed56c6b69205f1934a9');
    },
    setDeleted: function(objectName){
      return this.update({ deleted: true }, { where: { objectName }})
    },
  }
}


