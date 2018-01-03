const sequelize = require('sequelize');
const SEQ = require('../db');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');
const { DB_ENC_KEY } = require('config');

const GetPostJobQuery =`
  UPDATE 
      "PostJobs"
  SET 
      inprog=true
  WHERE
      id in (
          SELECT
              id
          FROM
              "PostJobs"
          WHERE
              inprog=false
          ORDER BY 
              id asc
          LIMIT 1 FOR UPDATE
      )
  RETURNING *;
`


module.exports = {
  Name: 'PostJob',
  Properties:{
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
  Associate({ Post, Photo }){
    this.belongsTo(Post);
    this.hasOne(Photo,{ through: Post, scope: { uploaded: true } });
  }, 
  Methods: {
    getUploadedPhoto: async function(){
       let photo = await this.getPhoto();
       return (this.Photo.uploaded) ? this.Photo : undefined;
    }
  },
  StaticMethods: {
    popPostJob: async () => get((await SEQ.query(GetPostJobQuery, { type: sequelize.QueryTypes.SELECT })),0), // TODO: model: require(./index).PostJob ???
    outstanding: function(){
      return this.findAll({ where: { finish: false, inprog: false }})
    }
  }
}


