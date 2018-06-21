module.exports = {
  up: ($, Sequelize) => $.bulkInsert('Devices', [{
    id: 1,
    online: true,
    idle: true,
    adbId: 'did-dev123',
    nodeName: 'HOME1',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    online: true,
    idle: true,
    adbId: 'did-dev456',
    enabled: true,
    nodeName: 'HOME1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    online: true,
    idle: true,
    enabled: true,
    adbId: 'did-dev789',
    nodeName: 'HOME1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  ]),

  down: ($, Sequelize) => {
    const { Op } = Sequelize;
    return $.bulkDelete('Devices', {
      id: { [Op.in]: [1, 2, 3] },
    }, {});
  },
};

