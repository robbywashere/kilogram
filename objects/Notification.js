const sequelize = require('sequelize');

const { isUndefined } = require('lodash');

const { STRING, ARRAY, TEXT, JSON: JSONType , INTEGER, VIRTUAL, BOOLEAN, Op, Model } = sequelize;

module.exports = {
  Name: 'Notification',
  Properties:{
    reads:{
      type: ARRAY(INTEGER)
    },
    title: {
      type: STRING 
    },
    text: {
      type: TEXT
    },
    body: {
      type: JSONType
    }
  },
  ScopeFunctions: true,
  Scopes: {
  },
  Init({ Account, NotificationRead }){
    this.hasMany(NotificationRead);
    this.belongsTo(Account, { foreignKey: { allowNull: false }});
  }, 
  Methods: {
    markAsRead: function(UserId){
      const { NotificationRead } = this.sequelize.models;
      return NotificationRead.create({  
        UserId,
        NotificationId: this.id
      })
    }
  },
  StaticMethods: {
    markAllAsRead: async function(UserId){

      const { NotificationRead } = this.sequelize.models;

      let allUnread = (await this.unread({ UserId }))
        .map(({ id: NotificationId })=>({ UserId, NotificationId }));

      return NotificationRead.bulkCreate(allUnread, { returning: true });

    },
    unread: function({ UserId, AccountId },opts){
      const { NotificationRead, Account, User } = this.sequelize.models;

      //TODO: Scoping needs to be narrowed down
      return (!isUndefined(AccountId) ? 
        this.scope({ where: { AccountId } }) : this)
        .findAll({
          where: {
            '$Account.Users.id$': { [Op.eq]: UserId },
            [Op.or]: [
              { '$NotificationReads.UserId$': { [Op.ne]: UserId } },
              { '$NotificationReads.UserId$': null  },
              //{ '$NotificationReads$': null  },
            ],
          },
          include: [ { model: Account, include: User  } ,{ 
            model: NotificationRead, 
            required: false,
            where: { 
               '$NotificationReads.UserId$': { [Op.eq]: UserId } 
            }
          }],
          ...opts
        })



    }
  }
}


