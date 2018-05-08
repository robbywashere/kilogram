const sequelize = require('sequelize');
const { 
  JobProperties, 
  JobScopes, 
  JobMethods, 
  JobStaticMethods ,
  InitPostJobQuery,
} = require('./_jobs');


module.exports = {
  Name: 'PostJob',
  Properties:{
    ...JobProperties,
  },
  ScopeFunctions: true,
  Scopes: {
    ...JobScopes,
  },
  Init({ Post, Photo, IGAccount, Account }){
    this.belongsTo(Post, { foreignKey: { unique: true } });
    this.belongsTo(Account, { foreignKey: { allowNull: false }});
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false }});
    this.addScope('withPost', { include: [ { model: Post, include: [ Photo ] } ] })
    this.addScope('withAll', { include: [ { model: Post, include: [Photo, Account, IGAccount ] }, Account, IGAccount ] })
  }, 
  Methods: {
    ...JobMethods
  },
  StaticMethods: {
    ...JobStaticMethods,
    initPostJobs: async function(){
      return this.$.query(InitPostJobQuery, { type: sequelize.QueryTypes.INSERT, model: this })
    },
  }
}


