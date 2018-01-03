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
      allowNull: false,
    },
    args: {
      type: sequelize.JSON,
      allowNull: false
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
  Associate({ BotchedJob, Post, Photo }){
    this.belongsTo(Post);
    
    this.hasOne(Photo,{ through: Post, scope: { uploaded: true } });
    this.hasMany(BotchedJob);
  }, 
  Methods: {
    getUploadedPhoto: async function(){
       let photo = await this.getPhoto();
       console.log(photo);
       return (this.Photo.uploaded) ? this.Photo : undefined;
    }
  },
  StaticMethods: {
    fromNewPost: function (post){
      const user = post.User;
      const { igUsername, igPassword } = user;
      return this.create({
        cmd: 'full_dance ',
        args: { username: igUsername, password: igPassword, desc: post.desc }
      })
    },
    popJob: async () => get((await SEQ.query(GetJobQuery, { type: sequelize.QueryTypes.SELECT })),0), // TODO: model: require(./index).Job ???
    outstanding: function(){
      return this.findAll({ where: { finish: false, inprog: false }})
    }
  }
}


