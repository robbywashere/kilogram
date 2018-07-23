const assert = require('assert');
const { User, Account } = require('../../objects');
const DBSync = require('../../db/sync');
const { Op } = require('sequelize');

describe('User object', () => {
  beforeEach(() => DBSync(true));

  it('should create a new Account when there is no Account for User', async () => {
    const user = await User.create({
      email: 'test@test.com',
      password: 'blah',
    });
    await user.reloadWithAccounts();
    assert.equal(user.Accounts.length, 1);
  });

  it('should create a new Account when included in object', async () => {
    const user = await User.create(
      {
        email: 'test@test.com',
        password: 'blah',
        Accounts: {},
      },
      { include: Account },
    );

    await user.reloadWithAccounts();
    assert.equal(user.Accounts.length, 1);
  });

  it('should scope other users to same account', async () => {
    const user = await User.create(
      {
        email: 'test@test.com',
        password: 'blah',
        Accounts: {},
      },
      { include: Account },
    );

    const user2 = await User.create(
      {
        email: 'test2@test.com',
        password: 'blah',
        Accounts: {},
      },
      { include: Account },
    );

    const user3 = await User.create(
      {
        email: 'test3@test.com',
        password: 'blah',
        Accounts: {},
      },
      { include: Account },
    );

    await user.reloadWithAccounts();
    await user2.addAccount(user.Accounts[0]);
    assert.equal(user.Accounts.length, 1);

    const users = await User.accountsScoped(user);

    assert.deepEqual(users.map(u => u.id), [1, 2]);
  });
});
