const sequelize = require('sequelize');
const DB = require('../db');
const { get } = require('lodash');
const { STRING, VIRTUAL, TEXT, DATE, Op } = sequelize;
const minioObj = require('../server-lib/minio/minioObject');
const { isLoggedIn, isSuperAdmin } = require('./_helpers');



module.exports = {
  Name: 'Post',
  Properties:{
    text: {
      type: TEXT
    },
    postDate: {
      type: DATE,
      allowNull: false
    },
    objectName: {
      type: VIRTUAL,
      allowNull: false
    }
  },
  AuthorizeInstance:{
    all: isSuperAdmin,
    create: function(user){
      if (!get(user,'Accounts.length')) {
        throw new Error('Attempt to scope to Account without Account on user object')
      }
      if (typeof this.IGAccountId === "undefined") {
        throw new Error('Posts IGAccountId is undefined');
      }
      return user.igAccountIds().includes(this.IGAccountId) && user.accountIds().includes(this.AccountId);
    },
  },
  PolicyAssert: true,
  Authorize: {
    all: isLoggedIn 
  },
  PolicyScopes: {
    all: 'userAccountScoped',
  },
  PolicyAttributes: {
    all: function(user){
      if (isSuperAdmin(user)) return true;
      return ['AccountId', 'IGAccountId', 'text', 'postDate', 'id', 'objectName']
    },
  },
  Init({ Job, Photo, Account, IGAccount }){
    this.belongsTo(Account, { foreignKey: { allowNull: false }});
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false }});
    this.hasOne(Job);
    this.belongsTo(Photo, { foreignKey: { allowNull: false  } });
    this.addScope('withJob', { include: [ Job ] } )
    this.addScope('due', { include: [ Job ], where: { 
      postDate: { [Op.lte]: sequelize.fn(`NOW`) },
      '$Job$': { [Op.eq]: null }
    }})
    this.addScope('withIGAccount', { include: [ IGAccount ] } )
  },
  ScopeFunctions: true,
  Hooks: {
    beforeValidate: async function(instance){
      const { Photo } = this.sequelize.models;
      const { PhotoId, objectName } = instance;
      if (!PhotoId) {
        const { accountId } = minioObj.parse(objectName);
        if (instance.AccountId !== accountId) throw new Error('AccountId mismatch for Post and Photo')
        const photo = await Photo.findOne({ where: { objectName }});
        if (photo){
          instance.dataValues.PhotoId = photo.id;
        }
      }
    }
  },
  Scopes: {
    userAccountScoped: function(user) {
      if (!get(user,'Accounts.length')) {
        throw new Error('Attempt to scope to Account without Account on user object')
      }
      const accountIds = user.Accounts.map(a=>a.id);
      return (isSuperAdmin(user)) ? {} : { where: { AccountId: { [Op.in]: accountIds } } }
    }
  },
  Methods:{
    initJob: async function(){
      const { Job } = DB.models; 
      try {
        await Job.create({
          PostId: this.id,     
          AccountId: this.AccountId,
          IGAccountId: this.IGAccountId
        })
      } catch(e){
        let error = e
        if (get(e,'errors[0].type') === "unique violation") { 
          // do nothing!
          //JUST SAY NOPE: error = new Error(`Job already exists for PostId: ${this.id}`); 
        } else {
          throw error;
        }
      }
    }
  },
  StaticMethods: {
  },
}

