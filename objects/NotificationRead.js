const sequelize = require('sequelize');
const { STRING, TEXT, JSON: JSONType , INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

module.exports = {
  Name: 'NotificationRead',
  Properties:{
    /*    read: {
      type: BOOLEAN,
      defaultValue: true
    }*/
  },
  ScopeFunctions: true,
  Scopes: {
  },
  Init({ Notification, User }){
    this.belongsTo(Notification, { foreignKey: { allowNull: false }});
    this.belongsTo(User, { foreignKey: { allowNull: false }});
  }, 
  Methods: {
  },
  StaticMethods: {
  }
}


