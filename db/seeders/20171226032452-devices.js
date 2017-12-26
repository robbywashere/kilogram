module.exports = {
  up: ($, Sequelize) => {
    return $.bulkInsert('Devices',[{
      id: 1,
      online: true,
      idle: true,
      adbId: 'did-dev123',
      createdAt: new Date(),
      updatedAt: new Date()
    },
      {
        id: 2,
        online: true,
        idle: true,
        adbId: 'did-dev456',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        online: true,
        idle: true,
        adbId: 'did-dev789',
        createdAt: new Date(),
        updatedAt: new Date()
      }

    ])
  },

  down: ($, Sequelize) => {
    const { Op } = Sequelize;
    return $.bulkDelete('Devices', {
      id: { [Op.in] : [1,2,3] }
    }, {});
  }
};
