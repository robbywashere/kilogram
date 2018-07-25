const sequelize = require('sequelize');
const demand = require('../lib/demand');
const { get } = require('lodash');
const sql = require('sql-template-strings');
const {
  STRING, ENUM, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;

// Turns oustanding posts into Jobs
// this exists since we are essentially #bulkCreate'ing from a subselect
// not currently possibly or feasible or optimizied to do in sequelize ;)
//

//TODO: impliment body !!!
const RetryTimesFailQuery = ({ tableName, id, max }) => `
  UPDATE 
    "${tableName}"
  SET 
    attempts=attempts + 1,
    status=(CASE 
        WHEN attempts+1 >= ${max} THEN 'FAILED'
        ELSE 'OPEN'
      END)::"enum_${tableName}_status"
  WHERE
    id = ${id}
  RETURNING *;
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

// TODO: add epoch?
const StatsQuery = tableName => `
  SELECT 
    sum(case when (status = 'OPEN') then 1 else 0 end) as open,
    sum(case when (status = 'SUCCESS') then 1 else 0 end) as success,
    sum(case when (status = 'FAILED') then 1 else 0 end) as failed,
    sum(case when (status = 'SLEEPING') then 1 else 0 end) as sleeping,
    sum(case when (status = 'SPINNING') then 1 else 0 end) as spinning
  from "${tableName}"
`;

// sum(case when (status = 'SUCCESS' AND (taskresult != 'NEGATIVE')) then 1 else 0 end) as missions_accomplished,

const JobMethods = {
  denormalize() {
    return this.reloadWithAll(); //
  },
  isInProgress() {
    return this.status === 'SPINNING';
  },
  isCompleted() {
    return this.status === 'SUCCESS';
  },
  isFailed() {
    return this.status === 'FAILED';
  },
  isOpen() {
    return this.status === 'OPEN';
  },
  isSleeping() {
    return this.status === 'SLEEPING';
  },
  complete(body) {
    return this.update({
      status: 'SUCCESS',
      body,
    });
  },

     

  retryTimesQuery({ body = {}, max = 3 } = {}) {
    return this.sequelize.query(RetryTimesFailQuery({ 
      tableName: this.constructor.tableName, 
      id: this.id,
      body,
      max 
    }),{
      type: sequelize.QueryTypes.SELECT,
      model: this.constructor,
    }).spread(x=>x.length?x[0]:x);
  },

  retryTimes({ body = {}, max = 3 } = {}) {
    return this.retryTimesQuery({ body, max });
  },
  retry() {
    return this.update({
      status: 'OPEN',
      attempts: this.attempts + 1,
    });
  },
  fail(body) {
    return this.update({
      status: 'FAILED',
      body,
    });
  },
  setFree() {
    return this.update({ status: 'OPEN' });
  },
  backout(err, sleep = false) {
    const error = typeof err !== 'object' ? String(error) : err;
    return this.update({
      status: sleep ? 'SLEEPING' : 'FAILED',
      body: error,
    });
  },
};

const JobInit = function JobInit({ Post, Account, IGAccount }){
    this.belongsTo(Post, { foreignKey: { unique: true,  onDelete: 'cascade '} });
    this.belongsTo(Account, { foreignKey: { onDelete: 'cascade' } });
    this.belongsTo(IGAccount, { foreignKey: { onDelete: 'cascade' } });
}

const JobStaticMethods = {

  retryTimes({ id, body = {}, max = 3 } = {}) {
    return this.sequelize.query(RetryTimesFailQuery({ 
      tableName: this.tableName, 
      id,
      body,
      max 
    }),{
      type: sequelize.QueryTypes.SELECT,
      model: this,
    }).spread(x=>x.length?x[0]:x);
  },

  async stats() {
    return this.sequelize.query(StatsQuery(this.tableName)).spread((r) => {
      const result = JSON.parse(JSON.stringify(get(r, 0)));
      for (const key of Object.keys(result)) result[key] = parseInt(result[key], 10) || 0;
      return result;
    });
  },
  complete(id) {
    return this.updateById(id, { status: 'SUCCESS' });
  },
  fail(id) {
    return this.updateById(id, { status: 'FAILED' });
  },
  async popJob() {
    const qry = GetJobQuery(this.tableName);
    const [job] = await this.sequelize.query(qry, {
      type: sequelize.QueryTypes.SELECT,
      model: this,
    });
    if (job) return job.reloadWithAll();
  },
};

const JobProperties = {
  body: {
    type: sequelize.JSON,
  },
  relations: {
    type: sequelize.JSON,
  },
  data: {
    type: sequelize.JSON,
  },
  attempts: {
    type: INTEGER,
    defaultValue: 0,
  },
  status: {
    type: ENUM('OPEN', 'SPINNING', 'SUCCESS', 'SLEEPING', 'FAILED'),
    defaultValue: 'OPEN',
  },
};

const JobScopes = {
  withAll: { include: [{ all: true, nested: true }] },
  outstanding: { where: { status: 'OPEN' } },
  sleeping: { where: { status: 'SLEEPING' } },
  completed: { where: { status: 'SUCCESS' } },
  failed: { where: { status: 'FAILED' } },
  inProgress: { where: { status: 'SPINNING' } },
};

const GenJobObj = {
  Properties: JobProperties,
  ScopeFunctions: true,
  Scopes: JobScopes,
  Init: JobInit,
  Methods: JobMethods,
  StaticMethods: JobStaticMethods,
};

module.exports = {
  GenJobObj,
  JobScopes,
  JobInit,
  JobMethods,
  JobStaticMethods,
  JobProperties,
  GetJobQuery,
  StatsQuery,
  JobObj: {
    Properties: JobProperties,
    Scopes: JobScopes,
    StaticMethods: JobStaticMethods,
    Methods: JobMethods,
  },
};
