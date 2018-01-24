const sequelize = require('sequelize');
const DB = require('../db');
const { get } = require('lodash');
const { STRING, TEXT, DATE, Op } = sequelize;



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
  AuthorizeInstance:{
    all: function(user){
      return user.isAccountRole(this.AccountId, ['member','admin'])
    }
  },
  PolicyAssert: true,
  Authorize: {
    all: function(user){
      return !!user
    }
  },
  PolicyScopes: {
    all: 'userAccountScoped',
  },
  PolicyAttributes: {
    all: ['id'],
    update: function(user){
      if (user.admin) return true; 
      else {
        return false;
      }
    },
    list: function(user){
      if (user.admin) return ['id','UserId'] 
      return ['id', 'AccountId', 'foo']
    }
  },
  Init({ Job, User, Photo, Account, IGAccount }){
    //this.belongsTo(IGAccount, { foreignKey: { allowNull: false }}); //TODO: add cascading deletes
    this.belongsTo(Account, { foreignKey: { allowNull: false }});
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false }});
    this.belongsTo(User, { foreignKey: { allowNull: false }}); //TODO: add cascading deletes -- REMOVE??
    this.hasOne(Job);
    this.hasOne(Photo, { foreignKey: { allowNull: false }}) // TODO: allowNull false?
    this.addScope('withJob', { include: [ Job ] } )
    this.addScope('due', { include: [ Job ], where: { 
      postDate: { [Op.lte]: sequelize.fn(`NOW`) },
      '$Job$': { [Op.eq]: null }
    }})
    this.addScope('withUser', { include: [ User ] } )
    this.addScope('withIGAccount', { include: [ IGAccount ] } )
  },
  ScopeFunctions: true,
  Hooks: {
  },
  Scopes: {
    userScoped: function(user) {
      return (user.admin) ? {} : { where: { UserId: user.id } }
    },
    userAccountScoped: function(user) {
      if (!get(user,'Accounts.length')) {
        throw new Error('Attempt to scope to Account without Account on user object')
      }
      const accountIds = user.Accounts.map(a=>a.id);
      return (user.admin) ? {} : { where: { AccountId: { [Op.in]: accountIds } } }
    }
  },
  Methods:{
    initJob: async function(){
      const { Job } = DB.models; 
      try {
        await Job.create({
          PostId: this.id,     
          UserId: this.UserId,
          AccountId: this.AccountId,
          IGAccountId: this.IGAccountId
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

