const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');
const { DB_ENC_KEY } = require('config');

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
  ScopeFunctions: true,
  Scopes: {
    outstanding: { where: { finish: false, inprog: false } }
  },
  Init({ Post, Photo, User }){
    this.belongsTo(Post, { foreignKey: { unique: true } });
    this.belongsTo(User);
    this.addScope('withPost', { include: [ { model: Post, include: [ Photo ] } ] })
    this.addScope('withAll', { include: [ { model: Post, include: [Photo] }, User ] })
  }, 
  Methods: {
  },
  StaticMethods: {
    popJob: async function(){ return get((await this.$.query(GetJobQuery, { type: sequelize.QueryTypes.SELECT })),0) } // TODO: model: require(./index).Job ???
  }
}


