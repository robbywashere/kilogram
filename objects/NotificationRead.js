module.exports = {
  Name: 'NotificationRead',
  Init({ Notification, User }) {
    this.belongsTo(Notification, { foreignKey: { allowNull: false } });
    this.belongsTo(User, { foreignKey: { allowNull: false } });
  },
};
