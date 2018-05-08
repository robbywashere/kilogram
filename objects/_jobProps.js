const sequelize = require('sequelize');
const { STRING, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

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
    return this.$.query(StatsQuery).spread(r=>{
      const result = JSON.parse(JSON.stringify(get(r,0)));
      for (let key of Object.keys(result)) result[key] = parseInt(result[key],10)||0;
      return result;
    });
  },
  initPostJobs: async function(){
    return this.$.query(InitPostJobQuery, { type: sequelize.QueryTypes.INSERT, model: this })
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

module.exports = { JobScopes, JobProperties, JobMethods, JobStaticMethods };
