const sequelize = require('sequelize');
const { get } = require('lodash');
const { STRING, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

//Turns oustanding posts into Jobs
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
      WHERE
        "Posts"."postDate" <= NOW()
      AND
        "PostJobs"."PostId" IS NULL 
    )
`


//TODO: https://blog.2ndquadrant.com/what-is-select-skip-locked-for-in-postgresql-9-5/

const GetJobQuery = (tableName) => `
  UPDATE 
      "${tableName}"
  SET 
      inprog=true
  WHERE
      id = (
          SELECT
              id
          FROM
              "${tableName}"
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


const StatsQuery = (tableName)=>`
  SELECT 
    sum(case when (finish = true) then 1 else 0 end) as completed,
    sum(case when (finish = false) AND (inprog = false) AND (sleep = false) then 1 else 0 end) as outstanding,
    sum(case when (sleep = true) AND (inprog = false) AND (finish = false) then 1 else 0 end) as sleeping,
    sum(case when (inprog = true) then 1 else 0 end) as in_progress
  from "${tableName}"
`;


const JobMethods = {
  complete: function(result){
    return this.update({
      inprog: false,
      finish: true,
      outcome: result 
    })
  },
  backout: function (error, sleep = true) { 
    return this.update({ inprog: false, sleep: true, finish: false, outcome: { success: false, error }}) 
  }
}

const JobStaticMethods = {
  stats: async function(){
    return this.$.query(StatsQuery(this.tableName)).spread(r=>{
      const result = JSON.parse(JSON.stringify(get(r,0)));
      for (let key of Object.keys(result)) result[key] = parseInt(result[key],10)||0;
      return result;
    });
  },
  popJob: async function(){ return get((await this.$.query(GetJobQuery(this.tableName), { type: sequelize.QueryTypes.SELECT, model: this })),0) }
}

const JobProperties = {
  outcome: {
    type: sequelize.JSON
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
  }
}


const JobScopes = {
  outstanding: { where: { finish: false, inprog: false, sleep: false } },
  sleeping: { where: { finish: false, inprog: false, sleep: true } },
  completed: { where: { finish: true } },
  inProgress:  { where: { inprog: true } }
}


module.exports = {
  JobScopes,
  JobMethods,
  JobStaticMethods,
  JobProperties,
  InitPostJobQuery,
  GetJobQuery,
  StatsQuery,
  JobObj: {
    Properties: JobProperties,
    Scopes: JobScopes,
    StaticMethods: JobStaticMethods,
    Methods: JobMethods,
  }
}
