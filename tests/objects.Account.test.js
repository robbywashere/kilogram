
const { Account, IGAccount, User, UserAccount } = require('../objects');
const { ezUser } = require('./helpers');
const DBSync = require('../db/sync');

describe('Account object',function(){

  beforeEach(function(){
    return DBSync(true);
  })

  it('Has multiple Users for one Account',async function(){

    const igAccount = await IGAccount.create({ id: 3 });
    const account = await Account.create({ id: 4 });

    await account.addIGAccount(igAccount);

    await account.reloadWithIgAccount();

    const user = await ezUser({ password:'dude', email: 'blah@blah.com' });
    const user2 = await ezUser({ email: 'blah2@blah2.com', password: 'dude' });
    await account.addUserAs(user,'admin')
    await account.addUserAs(user2,'member')

    const users = await account.getUsers()
    //console.log(users.find(u=>u.id !== user.id).UserAccount.role)
    //
    //
    
    const a = await user.getAccounts()
    await Account.update({ name: 'blah' },{ where: { id: 4 }})
    //await user.reloadWithAdminAccounts();

    u= await User.withAdminAccountsForId(user.id);

    //  await user.reloadWithAccounts();
    
    //const u = await User.findByIdWithAccounts(1)
    //console.log(u.Accounts.map(a=>({ role: a.UserAccount.role, accountId: a.id })))



    //    console.log(users.map(x=>x.toJSON()));

  
  })

})
