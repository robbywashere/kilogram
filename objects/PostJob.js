const sequelize = require('sequelize');
const { 
  JobProperties, 
  JobScopes, 
  JobMethods, 
  JobStaticMethods,
  InitPostJobQuery,
} = require('./_jobs');

/*  INSERT INTO
    "PostJobs"
    ("PostId", "IGAccountId", "AccountId", "createdAt", "updatedAt") (
      SELECT 
        "Posts"."id",
        "Posts"."IGAccountId",
        "Posts"."AccountId",
        NOW() "createdAt",
        NOW() "updatedAt"
      FROM
        "Posts"
      LEFT JOIN
        "PostJobs"
      ON 
        "PostJobs"."PostId" = "Posts"."id"
      WHERE
        "Posts"."postDate" <= NOW()
      AND
        "PostJobs"."PostId" IS NULL 
    )
    */

module.exports = {
  Name: 'PostJob',
  Properties:{
    ...JobProperties,
  },
  ScopeFunctions: true,
  Scopes: {
    ...JobScopes,
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
      return this.create({
        PostId: '$Post.id$',
        IGAccountId: '$Post.IGAccountId$',
        AccountId: '$Post.IGaccountId$',
      },{
        include: [ {
          model: this.sequelize.models.Post,
          where: { 
            postDate: { 
              [Op.lte] : sequelize.fn(`NOW()`),
            },
            '$PostJobs.PostId$' : null
          },
          include: [ this ]
        }]
      });
    },
    initPostJobs: async function(){
      return this.$.query(InitPostJobQuery, { type: sequelize.QueryTypes.INSERT, model: this })
    },
  }
}


