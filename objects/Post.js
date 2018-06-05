const sequelize = require('sequelize');
const DB = require('../db');
const { isUndefined, isNull, get } = require('lodash');

const {
  STRING, ENUM, UUID, VIRTUAL, TEXT, DATE, Op, ValidationError,
} = sequelize;
const { logger } = require('../lib/logger');
const minioObj = require('../server-lib/minio/minioObject');
const { isLoggedIn, isSuperAdmin } = require('./_helpers');
const {
  ForbiddenError, BadRequestError, NotFoundError, FinaleError,
} = require('finale-rest').Errors;
const { BadRequest } = require('http-errors');


module.exports = {
  Name: 'Post',
  Properties: {
    text: {
      type: TEXT,
    },
    photoUUID: { // TODO: wtf does this exist?
      type: UUID,
    },
    postDate: {
      type: DATE,
      allowNull: false,
    },
    status: {
      type: ENUM('DRAFT', 'PUBLISH', 'PUBLISHED'),
      defaultValue: 'PUBLISH', // TODO: NO
    },
  },
  Init({
    PostJob, Photo, Account, IGAccount,
  }) {
    this.belongsTo(Account, { foreignKey: { allowNull: false } });
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false } });
    this.hasOne(PostJob);
    this.belongsTo(Photo);
    this.addScope('withJob', { include: [PostJob] });
    this.addScope('due', {
      include: [PostJob],
      where: {
        postDate: { [Op.lte]: sequelize.fn('NOW') },
        $PostJob$: { [Op.eq]: null },
      },
    });
    // Not used delete me? this.addScope('withIGAccount', { include: [ IGAccount ] } )
  },
  ScopeFunctions: true,
  Hooks: {
    // TODO: this can all be done with one raw query and is not needed :(
    async beforeBulkCreate(instances) {
      for (const instance of instances) {
        await this.mapToPhoto(instance);
      }
    },
    beforeCreate(instance) {
      return this.mapToPhoto(instance);
    },
  },
  Scopes: {
    withAll: { include: [{ all: true }] },
    userScoped(user) {
      if (!get(user, 'Accounts.length')) {
        throw new Error('Attempt to scope to Account without Account on user object');
      }
      const accountIds = user.Accounts.map(a => a.id);
      return (isSuperAdmin(user)) ? {} : { where: { AccountId: { [Op.in]: accountIds } } };
    },
    userAccountScoped(user) {
      if (!get(user, 'Accounts.length')) {
        throw new Error('Attempt to scope to Account without Account on user object');
      }
      const accountIds = user.Accounts.map(a => a.id);
      return (isSuperAdmin(user)) ? {} : { where: { AccountId: { [Op.in]: accountIds } } };
    },
  },
  Methods: {
  },
  StaticMethods: {
    async mapToPhoto(instance) {
      const { Photo } = this.sequelize.models;
      const { photoUUID } = instance;
      if (isUndefined(photoUUID) || isNull(photoUUID)) {
        throw new ValidationError(`photoUUID cannot be ${(isUndefined(photoUUID)) ? 'undefined' : 'null'}`);
      }
      if (isUndefined(instance.PhotoId)) {
        const photo = await Photo.findOne({ where: { uuid: photoUUID } });
        if (photo) {
          instance.dataValues.PhotoId = photo.id;
        } else {
          throw new ValidationError(`Photo with UUID: ${photoUUID} not found`);
        }
      }
    },
    async createWithPhoto(opts) {
      return this.create({
        ...opts,
        PhotoId: (await this.$.models.Photo.findOne({ where: { uuid: opts.photoUUID } })).id,
      });
    },
  },
};

