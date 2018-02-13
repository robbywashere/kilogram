
const { Account, IGAccount, User, UserAccount } = require('../../objects');
const { ezUser } = require('../helpers');
const DBSync = require('../../db/sync');
const assert = require('assert');

describe('Account object',function(){

  beforeEach(function(){
    return DBSync(true);
  })

  it('Has multiple Users for one Account with discerned roles',async function(){

    const igAccount = await IGAccount.create({ id: 3 });
    const account = await Account.create({ id: 4 });

    await account.addIGAccount(igAccount);

    await account.reloadWithIgAccounts();

    const user = await ezUser({ password:'dude', email: 'blah@blah.com' });
    const user2 = await ezUser({ email: 'blah2@blah2.com', password: 'dude' });

    await account.addUserAs(user,'admin');

    await account.addUserAs(user2,'member');

    const users = await account.getUsers();

    assert(users.length,2);

    assert(users[0].UserAccount.role, 'admin');

    assert(users[1].UserAccount.role, 'member');
    
  })

})
