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
  Properties: {
    ...GenJobObj.Properties,
    status: {
    ...GenJobObj.Properties.status,
      notifiable: {
        notifyTable: 'Notifications',
        field: 'body',
        foreignKeys: ['AccountId']
      }
    }
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

