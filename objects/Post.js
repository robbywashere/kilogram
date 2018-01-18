const sequelize = require('sequelize');
const DB = require('../db');
const { get } = require('lodash');
const { STRING, TEXT, DATE, Op } = sequelize;

function userOrAdmin(user, record) {
  return user.isAdmin || (record.UserId === user.id) 
}


module.exports = {
  Name: 'Post',
  Properties:{
    foo: {
      type: TEXT
    },
    text: {
      type: TEXT
    },
    postDate: {
      type: DATE,
      allowNull: false
    }
  },
  Authorize: {
    all: function(user){
      return !!user
    }
  },
  PolicyScopes: {
    all: 'userScoped',
  },
  PolicyAttributes: {
    all: true,
    update: function(user){
      if (user.admin) return true; 
      return ['id']
    },
    list: function(user){
      if (user.admin) return ['id','UserId'] 
      return ['id']
    }
  },
  Init({ Job, User, Photo, IGAccount }){
    //this.belongsTo(IGAccount, { foreignKey: { allowNull: false }}); //TODO: add cascading deletes
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
    userScoped: function(user) {
      return (user.admin) ? {} : { where: { UserId: user.id } }
    }
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

