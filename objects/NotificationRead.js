const sequelize = require('sequelize');

const {
  STRING, TEXT, JSON: JSONType, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;

module.exports = {
  Name: 'NotificationRead',
  Properties: {
  },
  ScopeFunctions: true,
  Scopes: {
  },
  Init({ Notification, User }) {
    this.belongsTo(Notification, { foreignKey: { allowNull: false } });
    this.belongsTo(User, { foreignKey: { allowNull: false } });
  },
  Methods: {
  },
  StaticMethods: {
  },
};

