
const { Account, IGAccount, User, UserAccount } = require('../objects');
const DBSync = require('../db/sync');

describe.only('Account object',function(){

  beforeEach(function(){
    return DBSync(true);
  })
  it ('Has multiple Users for one Account',async function(){

    const igAccount = await IGAccount.create({ id: 3 });
    const account = await Account.create({ id: 4 });

    await account.addIGAccount(igAccount);

    await account.reloadWithIgAccount();

    //console.log(account.toJSON())

    const user = await User.create({ email: 'blah@blah.com' });
    const user2 = await User.create({ email: 'blah2@blah2.com' });
    await account.addUserAs(user,'member')
    await account.addUserAs(user2,'admin')

    //const users = await account.getUsers()
    //

    await user.reloadWithAccounts();
    console.log(user.toJSON()['Accounts'][0]);


    //    console.log(users.map(x=>x.toJSON()));

  
  })

})
