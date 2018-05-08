const sequelize = require('sequelize');
const { STRING, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');
const { DB_ENC_KEY } = require('config');
const { denormalizeJobBody } = require('./_helpers');

const { 
  InitJobQuery,
  InitJobsFromPostsQuery,
  GetJobQuery,
  JobStatsQuery 
} = require('./_customQueries');



module.exports = {
  Name: 'Job',
  Properties:{
    cmd: {
      type: STRING,
    },
    body: {
      type: sequelize.JSON,
    },
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
    },
  },
  ScopeFunctions: true,
  Scopes: {
    outstanding: { where: { finish: false, inprog: false, sleep: false } },
    sleeping: { where: { finish: false, inprog: false, sleep: true } },
    completed: { where: { finish: true } },
    inProgress:  { where: { inprog: true } }
    //outstanding: { where: { ran: false } }
  },
  Init({ Post, Photo, IGAccount, Account }){
    //TODO: !!! REMOVE THESE RELATIONS except for Account? - they are store in :body
    //This reduced coupling will also help migrate to an ACTUAL job queue where these relations do not exist
    this.belongsTo(Post, { foreignKey: { unique: true } });
    this.belongsTo(Account);//, { foreignKey: { allowNull: false }});
    this.belongsTo(IGAccount);//, { foreignKey: { allowNull: false }});
    this.addScope('withPost', { include: [ { model: Post, include: [ Photo ] } ] })
    this.addScope('withAll', { include: [ { model: Post, include: [Photo, Account, IGAccount ] }, Account, IGAccount ] })
  }, 
  Methods: {
    getDenormalizedBody: function(body) {
      return denormalizeJobBody(this.sequelize.models, this.body);
    },
    complete: function(result){
      return this.update({
        inprog: false,
        finish: true,
        outcome: result 
      })
    },
    backout: function (error, sleep = true) { 
      //     return this.update({ inprog: false, finish: false, outcome: { success: false, error: ((error && error.toString) ? error.toString() : error) }}) 
      return this.update({ inprog: false, sleep, finish: false, outcome: { success: false, error }}) 
    }
  },
  StaticMethods: {

    initJobFromVerifyIGAccount: async function(IGAccount){
      this.create({})
    },

    stats: async function(){
      return this.$.query(JobStatsQuery).spread(r=>{
        const result = JSON.parse(JSON.stringify(get(r,0)));
        for (let key of Object.keys(result)) result[key] = parseInt(result[key],10)||0;
        return result;
      });
    },
    initJobsFromPosts: async function(){
      return this.$.query(InitJobsFromPostsQuery, { type: sequelize.QueryTypes.INSERT, model: this })
    },

    initJobs: async function(){
      return this.$.query(InitJobQuery, { type: sequelize.QueryTypes.INSERT, model: this })
    },
    popJob: async function(){ return get((await this.$.query(GetJobQuery, { type: sequelize.QueryTypes.SELECT, model: this })),0) } // TODO: model: require(./index).Job ???
  }
}


