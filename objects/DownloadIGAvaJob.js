const { GenJobObj } = require('./_JobsBase');

module.exports = {
  ...GenJobObj,
  Name: 'DownloadIGAvaJob',
  Init({ IGAccount }) {
    this.belongsTo(IGAccount, { onDelete: 'cascade', foreignKey: { allowNull: false } });
  },
};
