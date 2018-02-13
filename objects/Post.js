const sequelize = require('sequelize');
const DB = require('../db');
const { isUndefined, isNull, get } = require('lodash');
const { STRING, UUID, VIRTUAL, TEXT, DATE, Op, ValidationError } = sequelize;
const minioObj = require('../server-lib/minio/minioObject');
const { isLoggedIn, isSuperAdmin } = require('./_helpers');
const { ForbiddenError, BadRequestError, NotFoundError, FinaleError } = require('finale-rest').Errors;
const { BadRequest } = require('http-errors');



module.exports = {
  Name: 'Post',
  Properties:{
    text: {
      type: TEXT
    },
    photoUUID: {
      type: UUID
    },
    postDate: {
      type: DATE,
      allowNull: false
    },
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
  Init({ Job, Photo, Account, IGAccount }){
    this.belongsTo(Account, { foreignKey: { allowNull: false }});
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false }});
    this.hasOne(Job);
    this.belongsTo(Photo);
    this.addScope('withJob', { include: [ Job ] } )
    this.addScope('due', { include: [ Job ], where: { 
      postDate: { [Op.lte]: sequelize.fn(`NOW`) },
      '$Job$': { [Op.eq]: null }
    }})
    this.addScope('withIGAccount', { include: [ IGAccount ] } )
  },
  ScopeFunctions: true,
  Hooks: {
    //TODO: this can all be done with one raw query and is not needed :(
    beforeBulkCreate: async function(instances) {
      for (const instance of instances) {
        await this.mapToPhoto(instance);
      }
    },
    beforeCreate: async function(instance){
      const { Photo } = this.sequelize.models;
      const { photoUUID } = instance;
      if (isUndefined(photoUUID) || isNull(photoUUID)) {
        throw new ValidationError(`photoUUID cannot be ${(!isNull(photoUUID)) ? 'undefined' : 'null'}`); 
      }
      if (isUndefined(instance.PhotoId)) {
        const photo = await Photo.findOne({ where: { uuid: photoUUID }});
        if (photo){
          instance.dataValues.PhotoId = photo.id;
        } else {
          //throw new BadRequest(`Photo with UUID: ${photoUUID} not found`)
          //
          throw new ValidationError(`Photo with UUID: ${photoUUID} not found`); 
        }
      }
    }
  },
  Scopes: {
    userScoped: function(user) {
      if (!get(user,'Accounts.length')) {
        throw new Error('Attempt to scope to Account without Account on user object')
      }
      const accountIds = user.Accounts.map(a=>a.id);
      return (isSuperAdmin(user)) ? {} : { where: { AccountId: { [Op.in]: accountIds } } }
    },
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
    mapToPhoto: async function(instance){
      const { Photo,} = this.sequelize.models;
      const { photoUUID } = instance;
      if (isUndefined(photoUUID) || isNull(photoUUID)) {
        throw new ValidationError(`photoUUID cannot be ${(isUndefined(photoUUID)) ? 'undefined' : 'null'}`); 
      }
      if (isUndefined(instance.PhotoId)) {
        const photo = await Photo.findOne({ where: { uuid: photoUUID }});
        if (photo){
          instance.dataValues.PhotoId = photo.id;
        } else {
          //throw new BadRequest(`Photo with UUID: ${photoUUID} not found`)
          //
          throw new ValidationError(`Photo with UUID: ${photoUUID} not found`); 
        }
      }
    },
    createWithPhoto: async function(opts){
      return this.create({ 
        ...opts,
        PhotoId: (await this.$.models.Photo.findOne({ where: { uuid: opts.photoUUID }})).id
      });

    },
  },
}

