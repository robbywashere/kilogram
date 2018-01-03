const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

module.exports = {
  Name: 'User',
  Properties:{
    igPassword: {
      type: STRING
    },
    igUsername: {
      type: STRING
    },
  },
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
  Associate({ Post }){
    this.hasMany(Post);
  },
}

