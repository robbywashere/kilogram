const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');
const { DB_ENC_KEY } = require('config');

const InitJobQuery = `
  INSERT INTO
    "Jobs"
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
        "Jobs"
      ON 
        "Jobs"."PostId" = "Posts"."id"
      WHERE
        "Posts"."postDate" <= NOW()
      AND
        "Jobs"."PostId" IS NULL 
    )
`

//TODO: https://blog.2ndquadrant.com/what-is-select-skip-locked-for-in-postgresql-9-5/
const GetJobQuery =`
  UPDATE 
      "Jobs"
  SET 
      inprog=true
  WHERE
      id = (
          SELECT
              id
          FROM
              "Jobs"
          WHERE
              inprog=false
          AND
              finish=false
          ORDER BY id 
          FOR UPDATE SKIP LOCKED
          LIMIT 1
      )
  RETURNING *;
`


module.exports = {
  Name: 'Job',
  Properties:{
    cmd: {
      type: STRING,
    },
    args: {
      type: sequelize.JSON,
    },
    outcome: {
      type: sequelize.JSON
    },
    objectPath: {
      type: STRING
    },
    inprog: {
      type: BOOLEAN,
      defaultValue: false
    },
    finish: { 
      type: BOOLEAN,
      defaultValue: false,
    }
  },
  PolicyAssert: false,
  ScopeFunctions: true,
  AuthorizeInstance:{},
  Scopes: {
    outstanding: { where: { finish: false, inprog: false } }
  },
  Init({ Post, Photo, IGAccount, Account }){
    this.belongsTo(Post, { foreignKey: { unique: true } });
    this.belongsTo(Account, { foreignKey: { allowNull: false }});
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false }});
    this.addScope('withPost', { include: [ { model: Post, include: [ Photo ] } ] })
    this.addScope('withAll', { include: [ { model: Post, include: [Photo, Account, IGAccount ] }, Account, IGAccount ] })
  }, 
  Methods: {
  },
  StaticMethods: {
    initJobs: async function(){
      return this.$.query(InitJobQuery, { type: sequelize.QueryTypes.INSERT, model: this })
    },
    popJob: async function(){ return get((await this.$.query(GetJobQuery, { type: sequelize.QueryTypes.SELECT, model: this })),0) } // TODO: model: require(./index).Job ???
  }
}


