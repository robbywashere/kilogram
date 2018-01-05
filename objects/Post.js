const sequelize = require('sequelize');
const { STRING, TEXT, DATE, Op } = sequelize;

module.exports = {
  Name: 'Post',
  Properties:{
    text: {
      type: TEXT
    },
    postDate: {
      type: DATE,
      allowNull: false
    }
  },
  Init({ Job, User, Photo }){
    this.belongsTo(User, { foreignKey: { allowNull: false }}); //TODO: add cascading deletes
    this.hasOne(Job);
    this.hasOne(Photo, { foreignKey: { allowNull: false }}) // TODO: allowNull false?
  },
  Hooks: {
    afterCreate: function (post){ 
      const { Job } = require('./index'); 
      return Job.create({
        PostId: post.id,     
        UserId: post.UserId,
      })
    }
  },
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
}

