const sequelize = require('sequelize');
const { STRING, JSON, TEXT, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

module.exports = {
  Name: 'BotchedJob',
  PolicyAssert: false,
  Properties:{
    adbId: {
      type: STRING
    },
    cmd: {
      type: STRING,
      allowNull: false,
    },
    args: {
      type: sequelize.JSON,
      allowNull: false
    },
    error: {
      type: TEXT,
      allowNull: false
    },
  },

  Init({ Job }){
    this.belongsTo(Job);
  }, 

  AuthorizeInstance:{},
  StaticMethods: {
    new: async function(job,{ cmd, args, error }) {
      //const { Job } = require('./index');

      // TODO: this is terrible?
      if (args.password) args.password = "********";
      //const Job = job.constructor;
      const err = error.toString(); //TODO: just incase?
      return this.create({ JobId: job.id, cmd, args, error: err });
    }
  }

}

