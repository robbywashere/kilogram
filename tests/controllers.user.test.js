
const assert = require('assert');

const { loadObjectControllers, } = require('../controllers');

const DB = require('../db');

const { exprezz, ezUser } = require('./helpers');

const dbSync = require('../db/sync');

const request = require('supertest');

const { User, Account } = require('../objects');

describe('User Controller', function(){
  before(()=>dbSync(true))
  it('Should scope users of same accounts',async function(){

    const user = await User.create({ password: 'x', email: 'x@x.com', Accounts: { } }, { include: [ Account ] })
  
    const user2 = await User.create({ password: 'x', email: 'x1@x1.com', Accounts: { } }, { include: [ Account ] })

    const user3 = await User.create({ password: 'x', email: 'x2@x2.com', Accounts: { } }, { include: [ Account ] })

    const app = exprezz(user);

    loadObjectControllers({ app, sequelize: DB, objects: { User }})

    await user.Accounts[0].addUser(user3)

     const res = await request(app)
      .get('/users?sort=-id&page=0&count=10')
      .expect(200)


    assert.deepEqual(res.body, [ { id: 3, email: 'x2@x2.com' }, { id: 1, email: 'x@x.com' } ]);

  
  })

})