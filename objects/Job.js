const sequelize = require('sequelize');
const { STRING, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
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
          AND
              sleep=false
          ORDER BY id 
          FOR UPDATE SKIP LOCKED
          LIMIT 1
      )
  RETURNING *;
`


const StatsQuery = `
  SELECT 
    sum(case when (finish = true) then 1 else 0 end) as completed,
    sum(case when (finish = false) AND (inprog = false) AND (sleep = false) then 1 else 0 end) as outstanding,
    sum(case when (sleep = true) AND (inprog = false) AND (finish = false) then 1 else 0 end) as sleeping,
    sum(case when (inprog = true) then 1 else 0 end) as in_progress
  from "Jobs"
`;

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
      sleep: {
        type: BOOLEAN,
        defaultValue: false
      },
      inprog: {
        type: BOOLEAN,
        defaultValue: false
      },
      finish: { 
        type: BOOLEAN,
        defaultValue: false,
      },
    },
    PolicyAssert: false,
    ScopeFunctions: true,
    AuthorizeInstance:{},
    Scopes: {
      outstanding: { where: { finish: false, inprog: false, sleep: false } },
      sleeping: { where: { finish: false, inprog: false, sleep: true } },
      completed: { where: { finish: true } },
      inProgress:  { where: { inprog: true } }
      //outstanding: { where: { ran: false } }
    },
    Init({ Post, Photo, IGAccount, Account }){
      this.belongsTo(Post, { foreignKey: { unique: true } });
      this.belongsTo(Account, { foreignKey: { allowNull: false }});
      this.belongsTo(IGAccount, { foreignKey: { allowNull: false }});
      this.addScope('withPost', { include: [ { model: Post, include: [ Photo ] } ] })
      this.addScope('withAll', { include: [ { model: Post, include: [Photo, Account, IGAccount ] }, Account, IGAccount ] })
    }, 
    Methods: {
      
      complete: function(result){
        return this.update({
          inprog: false,
          finish: true,
          outcome: result 
        })
      },
      backout: function (error, sleep = true) { 
        //     return this.update({ inprog: false, finish: false, outcome: { success: false, error: ((error && error.toString) ? error.toString() : error) }}) 
        return this.update({ inprog: false, sleep: true, finish: false, outcome: { success: false, error }}) 
      }
    },
    StaticMethods: {
      stats: async function(){
        return this.$.query(StatsQuery).spread(r=>{
          const result = JSON.parse(JSON.stringify(get(r,0)));
          for (let key of Object.keys(result)) result[key] = parseInt(result[key],10)||0;
          return result;
        });
      },
      initJobs: async function(){
        return this.$.query(InitJobQuery, { type: sequelize.QueryTypes.INSERT, model: this })
      },
      popJob: async function(){ return get((await this.$.query(GetJobQuery, { type: sequelize.QueryTypes.SELECT, model: this })),0) } // TODO: model: require(./index).Job ???
    }
  }


