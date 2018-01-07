const sequelize = require('sequelize');
const DB = require('../db');
const { get } = require('lodash');
const { STRING, TEXT, DATE, Op } = sequelize;

module.exports = {
  Name: 'Post',
  Properties:{
    text: {
      type: TEXT
    },
    postDate: {
      type: DATE,
      allowNull: false
    }
  },
  Init({ Job, User, Photo }){
    this.belongsTo(User, { foreignKey: { allowNull: false }}); //TODO: add cascading deletes
    this.hasOne(Job);
    this.hasOne(Photo, { foreignKey: { allowNull: false }}) // TODO: allowNull false?
    this.addScope('withJob', { include: [ Job ] } )
    this.addScope('due', { include: [ Job ], where: { 
      postDate: { [Op.lte]: sequelize.fn(`NOW`) },
      '$Job$': { [Op.eq]: null }
    }})
    this.addScope('withUser', { include: [ User ] } )
  },
  ScopeFunctions: true,
  Hooks: {
  },
  Scopes: {
  },
  Methods:{
    initJob: async function(){
      const { Job } = DB.models; 
      try {
        await Job.create({
          PostId: this.id,     
          UserId: this.UserId,
        })
      } catch(e){
        let error = e
        if (get(e,'errors[0].type') === "unique violation") { 
          // do nothing!
          //JUST SAY NOPE: error = new Error(`Job already exists for PostId: ${this.id}`); 
        } else {
          throw error;
        }
      }
    }
  },
  StaticMethods: {
  },
}

