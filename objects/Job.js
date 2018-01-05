const sequelize = require('sequelize');
const SEQ = require('../db');
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
  //ScopeFunctions: true,
  Scopes: {
    //full: { include: [{ all: true, nested: true }] }
  },
  Associate({ Post, Photo, User }){
    this.belongsTo(Post);
    this.belongsTo(User);
  }, 
  Methods: {
    getUploadedPhoto: async function(){
      let photo = await this.getPhoto();
      return (this.Photo.uploaded) ? this.Photo : undefined;
    }
  },
  StaticMethods: {
    findByIdFull: function(id, opts) { 
      return this.findById(id, { ...opts, include: [ { model: this.$.models.Post, include: [this.$.models.Photo] }, this.$.models.User ] 
      }) 
    },
    popJob: async () => get((await SEQ.query(GetJobQuery, { type: sequelize.QueryTypes.SELECT })),0), // TODO: model: require(./index).Job ???
    outstanding: function(){
      return this.findAll({ where: { finish: false, inprog: false }})
    }
  }
}


