const sequelize = require('sequelize');
const SEQ = require('../db');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');

const GetJobQuery =`
  UPDATE 
      "Jobs"
  SET 
      inprog=true
  WHERE
      id in (
          SELECT
              id
          FROM
              "Jobs"
          WHERE
              inprog=false
          ORDER BY 
              id asc
          LIMIT 1 FOR UPDATE
      )
  RETURNING *;
`


module.exports = {
  Name: 'Job',
  Properties:{
    cmd: {
      type: STRING,
      allowNull: false,
    },
    args: {
      type: sequelize.JSON,
      allowNull: false
    },
    outcome: {
      type: sequelize.JSON
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

  Associate({ BotchedJob }){
    this.hasMany(BotchedJob);
  }, 
  StaticMethods: {
    getJob: async () => get((await SEQ.query(GetJobQuery, { type: sequelize.QueryTypes.SELECT})),0),
    outstanding: function(){
      return this.findAll({ where: { finish: false, inprog: false }})
    }
  }
}


