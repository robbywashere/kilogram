
const { User, Account, UserAccount } = require('../objects');
const dbSync = require('../db/sync');

describe.skip('Account addUser',function(){

  beforeEach(()=>dbSync(true))

  it(`should not save when passed '{ save: false }'`, async function(){
    const user = await User.create({ password: 'x', email: 'x@x.com' })

    console.log(user.serialize());

    const account = await Account.create({})

    account.save = async ()=> {
       await account.addUser(user, { through:{ role: 'admin' } }); 
      return account.reloadWithUsers();;
    } 

    const result = await account.save();

    console.log(result.serialize())
  })


})
