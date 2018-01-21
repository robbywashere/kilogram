
const initController = require('../controllers');
const request = require('supertest');
const sync = require('../db/sync');
const express = require('express');
const { exprezz } = require('./helpers'); 
const { User, UserRecovery, Post } = require('../objects');
const assert = require('assert');
const { logger } = require('../lib/logger');
const DB = require('../db');

describe('controllers', function(){
  beforeEach(()=> {
    return sync(true);
  });

  it('should do stuff', async function(){
    const app = express();
    app.all('*',function(req,res,next){ 
      next();
    })

    initController({ app, sequelize: DB });


    try {
      const res = await request(app)
        .get('/users/2')
        .expect(403);
    } catch(e) {
      throw e
    }


  });


  it('should do post stuff', async function(){
    const user = await User.create();
    const post = await Post.create({ postDate: new Date(), UserId: 1 });
    const app = exprezz(user);
    initController({ app, sequelize: DB });
    try {
      const res = await request(app)
        .get('/posts')
        .expect(200);
    } catch(e) {
      throw e
    }
  });
  it('should do password recovery', async function(){

    const user = await User.create({ email: 'example@example.com' });

    const app = exprezz(user);

    initController({ app, sequelize: DB});

    try {
      const res = await request(app)
        .post('/user_recovery/1')
        .expect(200);
    } catch(e) {
      throw e
    }

    const key = (await UserRecovery.findOne({ where: { id: 1 }})).key

    try {
      const res = await request(app)
        .put('/user_recovery')
        .send({ newPassword: 'blah', key })
        .expect(200);
    } catch(e) {
      throw e
    }

    const u = await User.findById(1);
    assert(u.verifyPassword('blah'))

  })


  it('>>>> ok', async function(){



    const user = await User.create({ admin: false });
    const user2 = await User.create({ admin: true});

    await user2.update({ fooBar: 'blah' })

    const post = await Post.create({ postDate: new Date(), UserId: 1 });

    const post2 = await Post.create({ postDate: new Date(), UserId: 2 });


    const app = exprezz(user);
    initController({ app, sequelize: DB });

    try {
      const res = await request(app)
        .put('/posts/1')
        .send({ foo: 'bar' })
        .expect(200);
      logger('PUT',res.body)
    } catch(e) {
      throw e
    }
    try {
      const res = await request(app)
        .get('/posts')
        .expect(200);
      logger('GET',res.body)

      p = await Post.findById(1);
      logger(p.toJSON())
    } catch(e) {
      throw e
    }


  })

  it('should add policy scopes', async function(){

    const user = await User.create();
    const user2 = await User.create();
    const post = await Post.create({ postDate: new Date(), UserId: 1 });
    const post2 = await Post.create({ postDate: new Date(), UserId: 2 });

    const app = express();
    app.all('*',function(req,res,next){ 
      req.user = user;
      next();
    })
    initController({ app, sequelize: DB });
    try {
      const res = await request(app)
        .get('/posts')
        .expect(200);
      logger(res.body);
    } catch(e) {
      throw e
    }

  })



})
