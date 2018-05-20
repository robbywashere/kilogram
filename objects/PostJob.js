const sequelize = require('sequelize');
const { 
  JobProperties, 
  JobScopes, 
  JobMethods, 
  JobStaticMethods,
  InitPostJobQuery,
} = require('./_jobs');
const $seq = require('../db'); //TODO: not a fan of this since it could lead to circular dep bug problems and should be avoided

module.exports = {
  Name: 'PostJob',
  Properties:{
    ...JobProperties,
  },
  ScopeFunctions: true,
  Scopes: {
    ...JobScopes,
  },
  Hooks: {
    afterUpdate: function(instance) {
      //TODO: update post if completed 
    }
  },
  Init({ Post, Photo, IGAccount, Account }){
    this.belongsTo(Post, { foreignKey: { unique: true } });
    this.belongsTo(Account, { foreignKey: { allowNull: false }});
    this.belongsTo(IGAccount, { foreignKey: { allowNull: false }});
    this.addScope('withPost', { include: [ { model: Post, include: [ Photo ] } ] });
    this.addScope('withDeps', { include: [ IGAccount, { model: Post, include: [ Photo ] } ] });
  }, 
  Methods: {
    ...JobMethods,
    denormalize: function() {
      return this.reloadWithDeps();
    }
  },
  StaticMethods: {
    ...JobStaticMethods,
    initPostJob2: async function(){ //lol huh?
      return $seq.models.PostJob.create({
        PostId: '$Post.id$',
        IGAccountId: '$Post.IGAccountId$',
        AccountId: '$Post.AccountId$',
      },{
        include: [ {
          model: $seq.models.Post,
          where: { 
            postDate: { 
              [Op.lte] : sequelize.fn(`NOW()`),
            },
            '$PostJobs.PostId$' : null
          },
          include: [ $seq.models.PostJob ]
        }]
      });
    },
    //TODO: move this to a ServiceObject/ ServiceFunction type thing? do not like $seq
    initPostJobs: async function(){
      return $seq.query(InitPostJobQuery, { type: sequelize.QueryTypes.INSERT, model: $seq.models.PostJob })
    },
  }
}


