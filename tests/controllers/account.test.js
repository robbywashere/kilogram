
const assert = require('assert');

const { loadObjectControllers, } = require('../../controllers');

const DB = require('../../db');

const { exprezz, ezUser } = require('../helpers');

const dbSync = require('../../db/sync');

const request = require('supertest');

const { User, Account } = require('../../objects');

describe('Account Controller', function(){
  before(()=>dbSync(true))
  it('Should include account when scoped as such',async function(){

    const user = await User.create({ superAdmin: true, password: 'x', email: 'x@x.com', Accounts: { } }, { include: [ Account ] })

    const app = exprezz(user);

    loadObjectControllers({ app, sequelize: DB, objects: { Account }})

    const acct = await Account.findAll({ include: [ User ] })

    const res = await request(app)
      .get('/admin/accounts?scope=withUsers')
      .expect(200)

    assert.equal(res.body[0].Users[0].email,'x@x.com')

  })

})
