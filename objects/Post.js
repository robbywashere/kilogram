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
const Promise = require('bluebird');


module.exports = {
  Name: 'Post',
  Properties: {
    text: {
      type: TEXT,
    },
    postDate: {
      type: DATE,
      allowNull: false,
    },
    status: {
      type: ENUM('DRAFT', 'PUBLISH', 'PUBLISHED'),
      defaultValue: 'PUBLISH',
    },
  },
  Init({
    PostJob, Photo, Account, IGAccount,
  }) {
    this.belongsTo(Account, { onDelete: 'cascade', foreignKey: { allowNull: false } });
    this.belongsTo(IGAccount, { onDelete: 'cascade', foreignKey: { allowNull: false } });
    this.hasOne(PostJob, { onDelete: 'cascade' });
    this.belongsTo(Photo, { foreignKey: 'photoUUID', targetKey: 'uuid' } );

    this.addScope('published', {
      include: [PostJob],
      where: {
        '$PostJob.status$': { [Op.eq]: 'SUCCESS' },
      },
    });

    this.addScope('failed', {
      include: [PostJob],
      where: {
        '$PostJob.status$': { [Op.eq]: 'FAILED' },
      },
    });

    this.addScope('withJob', { include: [PostJob] });
    this.addScope('due', {
      include: [PostJob],
      where: {
        postDate: { [Op.lte]: sequelize.fn('NOW') },
        $PostJob$: { [Op.eq]: null },
      },
    });
  },
  ScopeFunctions: true,
  Hooks: {
  },
  Scopes: {
    withAll: { include: [{ all: true }] },
    userScoped(user) {
      const { Account, User } = this.sequelize.models;
      return ({
        where: { '$Account.Users.id$': user.id },
        include: [{
          model: Account,
          attributes: [],
          include: [{
            model: User,
            attributes: [],
          }],
        }],
      });
    },

  },
  Methods: {
  },
  StaticMethods: {
    async createWithPhoto(opts) {
      return this.create({
        ...opts,
        PhotoId: (await this.$.models.Photo.findOne({ where: { uuid: opts.photoUUID } })).id,
      });
    },
  },
};

