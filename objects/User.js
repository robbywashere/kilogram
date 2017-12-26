const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

module.exports = {
  Name: 'User',
  Properties:{

  },
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
  Associate({ Post }){
    this.hasMany(Post);
  }
}

