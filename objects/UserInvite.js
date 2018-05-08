const crypto = require('crypto');
const hashify = require('../server-lib/auth/hashify');
const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const cryptoRandomString = require('crypto-random-string');

module.exports = {
  Name: 'UserInvite',
  Properties:{
    key: {
      type: STRING,
      defaultValue: ()=> cryptoRandomString(32)
    },
    email: {
      type: STRING,
      allowNull: false,
      unique: 'compositeIndex',
      validate: {
        isEmail: true
      }
    },
  },
  ScopeFunctions: true, 
  Scopes: {
  },
  Hooks: {
    beforeCreate: async function(instance){
      if (!instance.User) { 
        const { email, Account } = instance;
        const $ = this.sequelize.models;
        let user = await $.User.findOne({ where: { email } })
        if (!user) {
          user = await $.User.create({
            email,
            verified: false,
            password: cryptoRandomString(32),
            Accounts: [ Account ],
          },{ include: [ $.Account ] });
        }
        instance.UserId = user.id;
      }
    },
  },
  Methods:{
    redeem: async function(){
      const { User } = this.sequelize.models;
      const user = await User.findOne({ where: { id: this.UserId  } })
      await Promise.all([
        user.addAccount(this.AccountId),
        this.destroy()
      ]);
      return user;
    },
  },
  StaticMethods: {
  },
  Init({ Account, User }){
    this.belongsTo(User);
    this.belongsTo(Account, { foreignKey: {
      allowNull: false,  
      unique: 'compositeIndex',
    }});
  },
}

