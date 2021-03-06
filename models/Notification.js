const sequelize = require('sequelize');

const { isUndefined } = require('lodash');

const {
  STRING, ARRAY, TEXT, JSON: JSONType, INTEGER, VIRTUAL, BOOLEAN, Op, Model,
} = sequelize;

module.exports = {
  Name: 'Notification',
  TableTriggers: [
    {
      after: 'INSERT',
    },
  ],
  Properties: {
    body: {
      type: JSONType,
    },
  },
  ScopeFunctions: true,
  Scopes: {},
  Hooks: {},
  Init({ Account, NotificationRead }) {
    this.hasMany(NotificationRead);
    this.belongsTo(Account, { onDelete: 'cascade', foreignKey: { allowNull: false } });
  },
  Methods: {
    markAsRead(UserId) {
      const { NotificationRead } = this.sequelize.models;
      return NotificationRead.create({
        UserId,
        NotificationId: this.id,
      });
    },
  },
  StaticMethods: {
    async markAllAsRead(UserId) {
      const { NotificationRead } = this.sequelize.models;

      const allUnread = (await this.unread({ UserId })).map(({ id: NotificationId }) => ({
        UserId,
        NotificationId,
      }));

      return NotificationRead.bulkCreate(allUnread, { returning: true });
    },
    unread({ UserId, AccountId }, opts) {
      const { NotificationRead, Account, User } = this.sequelize.models;

      return (!isUndefined(AccountId) ? this.scope({ where: { AccountId } }) : this).findAll({
        where: {
          '$Account.Users.id$': { [Op.eq]: UserId },
          [Op.or]: [
            { '$NotificationReads.UserId$': { [Op.ne]: UserId } },
            { '$NotificationReads.UserId$': null },
          ],
        },
        include: [
          { model: Account, include: User },
          {
            model: NotificationRead,
            required: false,
            where: {
              '$NotificationReads.UserId$': { [Op.eq]: UserId },
            },
          },
        ],
        ...opts,
      });
    },
  },
};
