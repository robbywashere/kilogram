const sequelize = require('sequelize');
const { STRING, TEXT, DATE, Op } = sequelize;

module.exports = {
  Name: 'Post',
  Properties:{
    photoURL: {
      type: STRING,
      allowNull: false,
    },
    text: {
      type: TEXT
    },
    postDate: {
      type: DATE
    }
  },
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
}

