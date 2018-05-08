const { 
  JobProperties, 
  JobScopes, 
  JobMethods, 
  JobStaticMethods ,
  InitPostJobQuery,
} = require('./_jobs');


module.exports = {
  Name: 'VerifyIGJob',
  Properties:{
    ...JobProperties,
  },
  ScopeFunctions: true,
  Scopes: {
    ...JobScopes,
  },
  Init({ IGAccount }){
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false }});
  }, 
  Methods: {
    ...JobMethods
  },
  StaticMethods: {
    ...JobStaticMethods,
  },
}


