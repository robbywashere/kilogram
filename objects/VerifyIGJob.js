const {
  JobProperties,
  JobScopes,
  JobMethods,
  JobStaticMethods,
  InitPostJobQuery,
} = require('./_JobsBase');


module.exports = {
  Name: 'VerifyIGJob',
  Properties: {
    ...JobProperties,
  },
  ScopeFunctions: true,
  Scopes: {
    ...JobScopes,
  },
  Init({ IGAccount }) {
    this.belongsTo(IGAccount, { onDelete: 'cascade', foreignKey: { allowNull: false } });
  },
  Methods: {
    ...JobMethods,
  },
  StaticMethods: {
    ...JobStaticMethods,
  },
};

