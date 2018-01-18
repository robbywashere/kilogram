
const initController = require('../controllers');
const request = require('supertest');
const sync = require('../db/sync');
const express = require('express');
const { User, Post } = require('../objects');
const DB = require('../db');

describe.only('controllers', function(){
  beforeEach(async ()=> {
    return await sync(true);
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
    const app = express();

    app.use(function(err, req, res, next) {
      logger.error(err);
      res.status(err.statusCode || 500)
        .send(err.msg || err.toString());
    });
    app.all('*',function(req,res,next){ 
      req.user = user;
      next();
    })
    initController({ app, sequelize: DB });
    try {
      const res = await request(app)
        .get('/posts')
        .expect(200);
    } catch(e) {
      throw e
    }
  });

  it.only('ok', async function(){



    const user = await User.create({ admin: false });
    const user2 = await User.create({ admin: true, fooBar: true });

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
      console.log(res.body);
    } catch(e) {
      throw e
    }
    try {
      const res = await request(app)
        .put('/posts/1',{ text: 'hey' })
        .expect(200);
      console.log(res.body);
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
      console.log(res.body);
    } catch(e) {
      throw e
    }

  })



})
