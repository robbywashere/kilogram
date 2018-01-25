
const Auth = require('../server-lib/auth')
const express = require('express');
const assert = require('assert');
const request = require('supertest');
const { User } = require('../objects');
const DBSync = require('../db/sync');

describe('server-lib/auth', function(){

  beforeEach(()=>DBSync(true))

  it('should login a user', async function(){

    const user = await User.create({ email: 'test@test.com', password:'blah'})

    const app = new express();

    app.use(Auth(app));

    app.use(function(err, req, res, next) {
      res.status(err.statusCode || 500)
        .send(err.msg || err.toString());
    });


    const res1 = await request(app)
      .post('/auth')
      .send({ username: 'test@test.com', password: 'blah' })
      .expect(200)

    assert.deepEqual(res1.body, { user: { id: 1, email: 'test@test.com' } });

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
