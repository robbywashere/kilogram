const sequelize = require('sequelize');
const SEQ = require('../db');
const { STRING,  TEXT, DATE, INTEGER, VIRTUAL, BOOLEAN, UUIDV4, UUID, Op } = sequelize;
const { get } = require('lodash');
const uuidv4 = require('uuid/v4');
const minioObj = require('../server-lib/minio/minioObject');
const { superAdmin } = require('./_helpers');

module.exports = {
  Name: 'Photo',
  PolicyAssert: false,
  Properties:{
    objectName: {
      type: TEXT,
      allowNull: false
    },
    uuid: {
      type: UUID,
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
  AuthorizeInstance:{},
  Policy: {
    show: {
      attr: function (user, photo)  {
        return isSuperAdmin(user) || ['id','src', 'objectName','bucket'] 
      }
    }
  },
  /* Scopes: {
    uploaded: true
  },*/
  Init({ Post }){
    //   this.belongsTo(Post);
  }, 
  StaticMethods: {
    setDeleted: function(objectName){
      return this.update({ deleted: true }, { where: { objectName }})
    },
  }
}


