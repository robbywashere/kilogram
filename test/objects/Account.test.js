const {
  Account, IGAccount, User, UserAccount,
} = require('../../models');
const { ezUser, newIGAccount, ezUserAccount } = require('../helpers');
const DBSync = require('../../db/sync');
const assert = require('assert');

describe('Account object', () => {
  beforeEach(() => DBSync(true));

  it('Has multiple Users for one Account with discerned roles', async () => {
    const user = await ezUserAccount();
    const user2 = await ezUser({ email: 'blah2@blah2.com' });

    const igAccount = await newIGAccount(user);

    const account = await Account.create({ id: 4 });

    await account.addIGAccount(igAccount);

    await account.reloadWithIgAccounts();

    await account.addUserAs(user, 'admin');

    await account.addUserAs(user2, 'member');

    const users = await account.getUsers();

    assert(users.length, 2);

    assert(users[0].UserAccount.role, 'admin');

    assert(users[1].UserAccount.role, 'member');
  });

  it('should scope an Account query to a user argument with .userScoped', async () => {
    const user1 = await ezUserAccount({ email: 'y@y.com' });
    const user2 = await ezUserAccount({ email: 'x@x.com' });

    const account3 = await Account.create({});

    await user1.addAccount(account3);

    const user1Accounts = await Account.userScoped(user1);
    const user2Accounts = await Account.userScoped(user2);

    assert(user1Accounts.length, 2);

    const user1AccountIds = (await user1.reload({ include: [Account] })).Accounts.map(a => a.id);

    const user1scopedAccountIds = user1Accounts.map(ua => ua.id);

    assert.deepEqual(user1AccountIds, user1scopedAccountIds);

    assert.equal(user1AccountIds.length, 2);

    const user2AccountIds = (await user2.reload({ include: [Account] })).Accounts.map(a => a.id);

    const user2scopedAccountIds = user2Accounts.map(ua => ua.id);

    assert.deepEqual(user2AccountIds, user2scopedAccountIds);

    assert.equal(user2AccountIds.length, 1);
  });
});
