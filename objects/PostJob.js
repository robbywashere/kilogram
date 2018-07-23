const sequelize = require('sequelize');
const {
  JobProperties,
  JobScopes,
  JobMethods,
  JobStaticMethods,
  InitPostJobQuery,
} = require('./_JobsBase');
const triggerProcedureInsert = require('../db/postgres-triggers/trigger-procedure-insert');
const db = require('../db'); // TODO: possible circular dep?

module.exports = {
  Name: 'PostJob',
  Properties: {
    ...JobProperties,
  },
  ScopeFunctions: true,
  Scopes: {
    ...JobScopes,
  },
  Hooks: {},
  Init({
    Post, Photo, IGAccount, Account,
  }) {
    this.belongsTo(Post, { foreignKey: { unique: true, allowNull: false } });
    this.belongsTo(Account, { onDelete: 'cascade', foreignKey: { allowNull: false } });
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false } });
    this.addScope('withPost', { include: [{ model: Post, include: [Photo] }] });

    // TODO: pull this out into something reusable by other objects
    // TODO: this logic should should be hooked into the ./engine's job:complete emmitter
    this.sequelize.addHook('afterBulkSync', () => {
      const assocs = Object.keys(this.associations).map(a => `${a}Id`);
      const watchColumn = 'status';
      const trigProcSQL = triggerProcedureInsert({
        watchTable: this.tableName,
        watchColumn,
        meta: { type: 'PostJob:status', resource: this.name },
        insertTable: 'Notifications',
        jsonField: 'body',
        prefix: ['data', this.name],
        recordKeys: [].concat(assocs, watchColumn, 'id'),
        foreignKeys: ['AccountId'],
      });
      return this.sequelize.query(trigProcSQL);
    });
  },
  Methods: {
    ...JobMethods,
  },
  StaticMethods: {
    ...JobStaticMethods,
    async initPostJobs() {
      return db.query(InitPostJobQuery, {
        type: sequelize.QueryTypes.INSERT,
        model: db.models.PostJob,
      });
    },
  },
};

/* async initPostJob2() {
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
    }, */
