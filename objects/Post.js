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
  Associate({ Job, User, Photo }){
    this.belongsTo(User, { foreignKey: { allowNull: false }}); //TODO: add cascading deletes
    this.hasOne(Job);
    this.hasOne(Photo) // TODO: allowNull false?
    this.addScope('defaultScope', { include: [{ model: User } ] }, { override: true });
  },
  Hooks: {
    afterCreate: async function (post){ //TODO: before create ??? 
      post.User = await post.getUser();
      const { Job } = require('./index'); //TODO: ????
      post.Job = await Job.fromNewPost(post);
      //TODO ??? post.save
    }
  },
  Scopes: {
  },
  Methods:{
  },
  StaticMethods: {
  },
}

