const { User, Account } = require('../../objects');

module.exports = {
  up: async ($, Sequelize) => {
    await User.create(
      {
        email: 'robertapolana@gmail.com',
        superAdmin: true,
        password: 'password',
        Accounts: {},
      },
      { include: [Account] },
    );
  },

  down: async ($, Sequelize) => {
    await User.destroy({
      where: {
        email: 'robertapolana@gmail.com',
      },
    });
  },
};
