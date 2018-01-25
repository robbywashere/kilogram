
const assert = require('assert');

const { loadObjectControllers, } = require('../controllers');

const DB = require('../db');

const { exprezz, ezUser } = require('./helpers');

const dbSync = require('../db/sync');

const request = require('supertest');

const { User, Account } = require('../objects');

describe.only('Account Controller', function(){
  before(()=>dbSync(true))
  it('Should include account when scoped as such',async function(){

    const user = await User.create({ superAdmin: true, password: 'x', email: 'x@x.com', Accounts: { } }, { include: [ Account ] })

    const app = exprezz(user);

    loadObjectControllers({ app, sequelize: DB, objects: { Account }})

    const acct = await Account.findAll({ include: [ User ] })

    //console.log(acct.map(a=>a.toJSON()))

    const res = await request(app)
      .get('/accounts?scope=withUsers')
      .expect(200)

    console.log(JSON.parse(res.text))




  })

})
