const { Job } = require('../../objects');
module.exports = {
  up: ($, Sequelize) => {
    return Job.bulkCreate([{
      id: 1,
      args: {},
      cmd: 'echo',
    },
      {
        id: 2,
        args: {},
        cmd: 'echo'
      },
      {
        id: 3,
        args: {},
        cmd: 'echo',
      }

    ])
  },

  down: ($, Sequelize) => {
    const { Op } = Sequelize;
    return $.bulkDelete('Jobs', {
      id: { [Op.in] : [1,2,3] }
    }, {});
  }
};

