const sequelize = require('sequelize');
const {
  JobProperties,
  JobScopes,
  JobMethods,
  JobStaticMethods,
  InitPostJobQuery,
} = require('./_JobsBase');
const db = require('../db'); //TODO: possible circular dep?

module.exports = {
  Name: 'PostJob',
  Properties: {
    ...JobProperties,
  },
  ScopeFunctions: true,
  Scopes: {
    ...JobScopes,
  },
  Hooks: {
    afterUpdate(instance) {
      // TODO: update post if completed
    },
  },
  Init({
    Post, Photo, IGAccount, Account,
  }) {
    this.belongsTo(Post, { foreignKey: { unique: true } });
    this.belongsTo(Account, { onDelete: 'cascade', foreignKey: { allowNull: false } });
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false } });
    this.addScope('withPost', { include: [{ model: Post, include: [Photo] }] });
    this.addScope('withDeps', { include: [IGAccount, { model: Post, include: [Photo] }] });
  },
  Methods: {
    ...JobMethods,
    denormalize() {
      return this.reloadWithAll();
    },
  },
  StaticMethods: {
    ...JobStaticMethods,
    /*async initPostJob2() {
      return db.models.PostJob.create({
        PostId: '$Post.id$',
        IGAccountId: '$Post.IGAccountId$',
        AccountId: '$Post.AccountId$',
      }, {
        include: [{
          model: db.models.Post,
          where: {
            postDate: {
              [Op.lte]: sequelize.fn('NOW()'),
            },
            '$PostJobs.PostId$': null,
          },
          include: [db.models.PostJob],
        }],
      });
    },*/
    async initPostJobs() {
      return this.sequelize.query(InitPostJobQuery, { type: sequelize.QueryTypes.INSERT, model: this.sequelize.models.PostJob });
    },
  },
};

