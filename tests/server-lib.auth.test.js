
const Jwt = require('../server-lib/auth/jwt');
const Auth = require('../server-lib/auth');
const express = require('express');
const assert = require('assert');
const request = require('supertest');
const { Account, User } = require('../objects');
const { appLogger } = require('./helpers');
const DBSync = require('../db/sync');


describe('server-lib/auth', function(){

  beforeEach(()=>DBSync(true))

  it('should auth with JWT', async function(){

    const user = await User.create({ email: 'test@test.com', password:'blah', Accounts: [{}]},{ include: [ Account ] })

    const app = new express();

    appLogger(app);

    app.use(Jwt(app));


    const res1 = await request(app)
      .post('/auth')
      .send({ username: 'test@test.com', password: 'blah' })
      .expect(200);

    const { token } = res1.body;

    const res2 = await request(app)
      .get('/auth')
      .set(`Authorization`, `Bearer ${token}`)
      .expect(200)

    assert.equal(res2.body.id,user.id);
    assert(res2.body.Accounts[0]);
    assert.equal(res2.body.Accounts[0].id, user.Accounts[0].id)


    const res3 = await request(app)
      .get('/auth')
      .expect(401)


  });


  it('should login a user', async function(){

    const user = await User.create({ email: 'test@test.com', password:'blah'})

    const app = new express();

    app.use(Auth(app));

    appLogger(app);

    const res1 = await request(app)
      .post('/auth')
      .send({ username: 'test@test.com', password: 'blah' })
      .expect(200)

    assert.equal(res1.body.user.email, 'test@test.com');

    const res2 = await request(app)
      .post('/auth')
      .send({ username: 'test@test.com', password: 'wrong' })
      .expect(401)

    assert.equal(res2.user, undefined)

    const res3 = await request(app)
      .delete('/auth')
      .expect(200);
    assert.equal(res3.user, undefined)

  })


})
