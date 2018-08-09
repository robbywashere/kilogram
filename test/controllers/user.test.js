const assert = require('assert');

const { loadObjectControllers } = require('../../controllers');

const DB = require('../../db');

const { exprezz,  request, ezUser } = require('../helpers');

const dbSync = require('../../db/sync');

const { User, Account } = require('../../models');

describe('User Controller', () => {
  before(() => dbSync(true));
  it.skip('Should scope users of same accounts', async () => {
    const user = await User.create(
      {
        superAdmin: true,
        password: 'x',
        email: 'x@x.com',
        Accounts: {},
      },
      { include: [Account] },
    );

    const user2 = await User.create(
      { password: 'x', email: 'x1@x1.com', Accounts: {} },
      { include: [Account] },
    );

    const user3 = await User.create(
      { password: 'x', email: 'x2@x2.com', Accounts: {} },
      { include: [Account] },
    );

    const app = exprezz(user);

    loadObjectControllers({ app, sequelize: DB, objects: { User } });

    await user.Accounts[0].addUser(user3);

    const res = await request(app)
      .get('/admin/users?sort=-id&page=0&count=10')
      .expect(200);

    assert.deepEqual(res.body.map(u => ({ id: u.id, email: u.email })), [
      { id: 3, email: 'x2@x2.com' },
      { id: 1, email: 'x@x.com' },
    ]);
  });
});
