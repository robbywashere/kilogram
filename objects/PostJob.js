const sequelize = require('sequelize');
const {
  JobProperties,
  JobScopes,
  GenJobObj,
  JobInit,
  JobMethods,
  JobStaticMethods,
} = require('./_JobsBase');

const triggerProcedureInsert = require('../db/postgres-triggers/trigger-procedure-insert');

const db = require('../db'); // TODO: possible circular dep?

const InitPostJobQuery = `
  INSERT INTO
    "PostJobs"
    ("PostId", "IGAccountId", "AccountId", "createdAt", "updatedAt") (
      SELECT 
      "Posts"."id",
        "Posts"."IGAccountId",
        "Posts"."AccountId",
        NOW() "createdAt",
        NOW() "updatedAt"
      FROM
        "Posts"
      LEFT JOIN
        "PostJobs"
      ON 
        "PostJobs"."PostId" = "Posts"."id"
      LEFT JOIN
        "IGAccounts"
      ON
        "Posts"."IGAccountId" = "IGAccounts"."id"
      WHERE
        "Posts"."postDate" <= NOW()
      AND
        "PostJobs"."PostId" IS NULL 
      AND 
        "Posts"."status" = 'PUBLISH'
      AND 
        "IGAccounts"."status" = 'GOOD'
    )
`;

module.exports = {
  ...GenJobObj,
  Name: 'PostJob',
  Init(modelDefs) {

    GenJobObj.Init.bind(this)(modelDefs);

    // TODO: pull this out into something reusable by other objects
    // TODO: this logic should should be hooked into the ./engine's job:complete emmitter
    this.sequelize.addHook('afterBulkSync', () => {
      const assocs = Object.keys(this.associations).map(a => `${a}Id`);
      const watchColumn = 'status';
      const trigProcSQL = triggerProcedureInsert({
        watchTable: this.tableName,
        watchColumn,
        meta: { type: 'PostJob:status', resource: this.name },
        //meta: { type: `${this.name}:${watchColumn}`, resource: this.name },
        insertTable: 'Notifications',
        jsonField: 'body',
        prefix: ['data', this.name],
        recordKeys: [].concat(assocs, watchColumn, 'id'),
        foreignKeys: ['AccountId'],
      });
      return this.sequelize.query(trigProcSQL);
    });
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

