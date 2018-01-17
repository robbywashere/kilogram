const sequelize = require('sequelize');
const crypto = require('crypto');
const hashify = require('../server-lib/auth/hashify');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;

module.exports = {
  Name: 'User',
  Properties:{
    password: {
      type: VIRTUAL,
      set: function(val){ this.setDataValue('passwordHash', hashify(this.passwordSalt, val)) }
    },
    passwordHash: {
      type: STRING,
    },
    passwordSalt: {
      type: STRING,
      defaultValue: ()=> crypto.randomBytes(16).toString('hex')
    },
    igPassword: {
      type: STRING
    },
    igUsername: {
      type: STRING
    },
    isAdmin: {
      type: BOOLEAN,
      defaultValue: false
    }
  },
  Scopes: {
  },
  Methods:{
    verifyPassword: function (password) { return (this.passwordHash === hashify(this.passwordSalt, password)) }
  },
  StaticMethods: {
  },
  Init({ Post, IGAccount }){
    this.belongsToMany(IGAccount,{ through: 'UserIGAccount' })
    this.hasMany(Post);
  },
}

