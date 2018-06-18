const {
  Post, Account, VerifyIGJob, IGAccount, User, UserAccount,
} = require('../../objects');
const { ezUser} = require('../helpers');
const DBSync = require('../../db/sync');
const assert = require('assert');

describe('IGAccount object', () => {
  beforeEach(() => DBSync(true));

  it('can be created and added to account', async () => {
    const account = await Account.create({});
    const igAccount = await IGAccount.create({
      username: 'username',
      password: 'password',
      AccountId: account.id,
    });

    assert(await IGAccount.findOne({ where: { id: igAccount.id } }));

    await account.addIGAccount(igAccount);

    await igAccount.reload();

    await account.reloadWithIgAccounts();

    assert(account.IGAccounts[0]);
    assert.equal(account.IGAccounts[0].AccountId, igAccount.AccountId);
  });


  it('should be destroyed IGAccount when Account is destroyed', async () => {
    const account = await Account.create({});
    const igAccount = await IGAccount.create({
      username: 'username',
      password: 'password',
      AccountId: account.id,
    });
    assert((await IGAccount.findById(igAccount.id)));
    await account.destroy();
    assert(!(await IGAccount.findById(igAccount.id)));
  });

  it('should set status to UNVERIFIED on password change of IGAccount', async () => {
    const account = await Account.create({});
    const igAccount = await IGAccount.create({
      username: 'username',
      password: 'password',
      AccountId: account.id,
      status: 'GOOD',
    });

    assert.equal(igAccount.status, 'GOOD');

    await igAccount.update({ password: 'newpassword' });

    assert.equal(igAccount.status, 'UNVERIFIED');
  });


  it('should create a \'VerifyIGJob\' job afterCreate', async () => {
    const account = await Account.create({});
    const igAccount = await IGAccount.create({
      username: 'username',
      password: 'password',
      AccountId: account.id,
    });


    const vig = await VerifyIGJob.findOne();

    assert.equal(vig.IGAccountId, 1);
  });
});
