
const assert = require('assert');

const { loadObjectControllers, } = require('../../controllers');

const DB = require('../../db');

const { exprezz, appLogger, ezUser } = require('../helpers');

const dbSync = require('../../db/sync');

const request = require('supertest');

const { User, Account } = require('../../objects');

const AccountController = require('../../controllers/account');

describe('Account Controller', function(){
  beforeEach(()=>dbSync(true))
  it('finale: Should include account when scoped as such',async function(){

    const user = await User.create({ superAdmin: true, password: 'x', email: 'x@x.com', Accounts: { } }, { include: [ Account ] })

    const app = exprezz(user);

    loadObjectControllers({ app, sequelize: DB, objects: { Account }})

    const acct = await Account.findAll({ include: [ User ] })

    const res = await request(app)
      .get('/admin/accounts?scope=withUsers')
      .expect(200)

    assert.equal(res.body[0].Users[0].email,'x@x.com')

  });

  it('should remove existing user from account', async function(){
  
    const account = await Account.create();
    
    const user = await ezUser();
    const userAdmin = await ezUser({ email: 'x@x.com' });

    await account.addUserAs(user,'member');
    await account.addUserAs(userAdmin,'admin');
  
    
    await user.reloadWithAccounts();
    await userAdmin.reloadWithAccounts();
  
    const app = exprezz(userAdmin);

    app.use(AccountController());

    const res= await request(app)
      .delete(`/${account.id}/user/${user.id}`)
      .expect(200);

    await user.reload();

    assert(!user.Accounts.filter(a=>a.id === account.id).length)
  
  })

  it('should add existing user to account as role', async function(){


    const account = await Account.create();
    
    const user = await ezUser();

    await account.addUserAs(user,'admin');

    user.reloadWithAccounts();

    const userToAdd = await ezUser({
      email: 'userToAdd@example.com',
      Accounts: { } }, { include: [ Account ] 
      });

    const app = exprezz(user);

    app.use(AccountController());


    const res= await request(app)
      .post(`/${account.id}/user/${userToAdd.id}/admin`)
      .expect(200);

    await userToAdd.reloadWithAccounts();

    assert(userToAdd.Accounts[1])

    assert(userToAdd.Accounts[1].id, account.id);

    assert.equal(userToAdd.Accounts[1].UserAccount.role, 'member')

    assert.equal(userToAdd.Accounts[1].UserAccount.UserId, userToAdd.id)
      

  })

})
