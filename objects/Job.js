const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

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
    outstanding: function(){
      return this.findAll({ where: { finish: false, inprog: false }})
    }
  }
}

