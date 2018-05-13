
const { Account, VerifyIGJob, IGAccount, User, UserAccount } = require('../../objects');
const { ezUser } = require('../helpers');
const DBSync = require('../../db/sync');
const assert = require('assert');

describe('IGAccount object',function(){

  beforeEach(function(){
    return DBSync(true);
  })

  it('can be created and added to account',async function(){

    const account =  await Account.create({});
    const igAccount = await IGAccount.create({
      username: 'username',
      password: 'password',
      AccountId: account.id,
    });

    assert(await IGAccount.findOne({ where: { id: igAccount.id }}));

    await account.addIGAccount(igAccount);

    await igAccount.reload();

    await account.reloadWithIgAccounts()

    assert(account.IGAccounts[0]);
    assert.equal(account.IGAccounts[0].AccountId,igAccount.AccountId);



  })


  it(`should create a 'VerifyIGJob' job afterCreate`,async function(){

    const account =  await Account.create({});
    const igAccount = await IGAccount.create({
      username: 'username',
      password: 'password',
      AccountId: account.id,
    });


    const vig = await VerifyIGJob.findOne();

    assert.equal(vig.IGAccountId, 1)


  })


})
