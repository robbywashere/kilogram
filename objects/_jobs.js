const sequelize = require('sequelize');
const { get } = require('lodash');

const {
  STRING, ENUM, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;

// Turns oustanding posts into Jobs
// this exists since we are essentially #bulkCreate'ing from a subselect
// not currently possibly or feasible or optimizied to do in sequelize ;)
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
      AND 
        "Posts"."status" = 'PUBLISH'
    )
`;


// TODO: https://blog.2ndquadrant.com/what-is-select-skip-locked-for-in-postgresql-9-5/

const GetJobQuery = tableName => `
  UPDATE 
      "${tableName}"
  SET 
      status='SPINNING'
  WHERE
      id = (
          SELECT
              id
          FROM
              "${tableName}"
          WHERE
              status='OPEN'
          ORDER BY id 
          FOR UPDATE SKIP LOCKED
          LIMIT 1
      )
  RETURNING *;
`;


const StatsQuery = tableName => `
  SELECT 
    sum(case when (status = 'OPEN') then 1 else 0 end) as open,
    sum(case when (status = 'SUCCESS') then 1 else 0 end) as success,
    sum(case when (status = 'SUCCESS' AND (taskresult != 'NEGATIVE')) then 1 else 0 end) as missions_accomplished,
    sum(case when (status = 'FAILED') then 1 else 0 end) as failed,
    sum(case when (status = 'SLEEPING') then 1 else 0 end) as sleeping,
    sum(case when (status = 'SPINNING') then 1 else 0 end) as spinning
  from "${tableName}"
`;


const JobMethods = {
  denormalize() {
    return this.reload({ include: [{ all: true }] }); //
  },
  complete({ body, resultOf }) {
    const taskresult = (typeof resultOf === 'undefined') ? 'UNKNOWN' : (resultOf) ? 'POSITIVE' : 'NEGATIVE';

    return this.update({
      taskresult,
      status: get(body, 'success') ? 'SUCCESS' : 'FAILED',
      body,
    });
  },
  backout(err, sleep = false) {
    const error = (typeof err !== 'object') ? String(error) : err;
    return this.update({
      status: (sleep) ? 'SLEEPING' : 'FAILED',
      body: error,
    });
  },
};

const JobStaticMethods = {

  async stats() {
    return this.$.query(StatsQuery(this.tableName)).spread((r) => {
      // Object.keys(JSON.parse(JSON.stringify(get(r,0)))).reduce( (p,n) => ({ ...p, [n] :(parseInt(result[key],10)||0) }),{});
      const result = JSON.parse(JSON.stringify(get(r, 0)));
      for (const key of Object.keys(result)) result[key] = parseInt(result[key], 10) || 0;
      return result;
    });
  },
  async popJob() { return get((await this.$.query(GetJobQuery(this.tableName), { type: sequelize.QueryTypes.SELECT, model: this })), 0); },
};

/*
 *
 * Job itself, did what it was told --- status = SUCCESS
 *
 * result of job was not good --- result = NEGATIVE vs result = POSTIVE
 *
 *
 */

const JobProperties = {
  body: {
    type: sequelize.JSON,
  },
  taskresult: {
    type: ENUM('UNKNOWN', 'POSITIVE', 'NEGATIVE'),
  },
  status: {
    type: ENUM('OPEN', 'SPINNING', 'SUCCESS', 'SLEEPING', 'FAILED'),
    defaultValue: 'OPEN',
  },
};


const JobScopes = {
  withAll: { include: [{ all: true }] },
  outstanding: { where: { status: 'OPEN' } },
  sleeping: { where: { status: 'SLEEPING' } },
  completed: { where: { status: 'SUCCESS' } },
  failed: { where: { status: 'FAILED' } },
  inProgress: { where: { status: 'SPINNING' } },
};


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
  },
};
