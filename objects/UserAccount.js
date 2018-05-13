const sequelize = require('sequelize');
const { ENUM } = sequelize;

module.exports = {
  Name: 'UserAccount',
  Properties:{
    role: {
      type: ENUM('member','admin'),
      allowNull: false,
      defaultValue: 'member',
      /*validate: {
          isIn: [['member', 'admin']]
      }*/
    }
  },
}

