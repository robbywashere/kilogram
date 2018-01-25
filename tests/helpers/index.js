const {readdirSync, readFileSync } = require('fs');
const { User, Photo, Account, IGAccount, Post } = require('../../objects');
const minioObj = require('../../server-lib/minio/minioObject');

function loadFixture(name) {
  return readFileSync(`${__dirname}/../fixtures/${name}`).toString();
}

function fixtures(){
  const fixies = readdirSync(`${__dirname}/../fixtures`);
  const o = {};
  fixies.forEach(f => o[f] = loadFixture(f) );
  return o;
}

function exprezz(user = {}){
  const app = require('express')();
  app.use(require('body-parser').json());
  app.all('*',function(req,res,next){ 
    req.user = user;
    next();
  })
  app.use(function(err, req, res, next) {
    logger.error(err);
    res.status(err.statusCode || 500)
      .send(err.msg || err.toString());
  });
  return app;
}

async function createAccountUserPostJob(){


  const user = await User.create({
    password: 'blah',
    email: 'test@test.com'
  });
  const account = await Account.create();
  const igAccount = await IGAccount.create();
  let post = await Post.create({
    postDate: new Date(),
    UserId: user.id,
    AccountId: account.id,
    IGAccountId: igAccount.id,
    Photo: {
      bucket: 'uploads',
      objectName: minioObj.create('v2',{ payload: true })
    }
  },{
    include: [ Photo ]
  })

  await post.initJob();
  await post.reloadWithJob();

  job = post.Job;
  return { account, igAccount, user, post, job }
}

async function ezUser(opts){
  return User.create(Object.assign({
    password: 'blah',
    email: 'test@test.com',
  },opts))
}

async function createAccountUserPost(){
  const user = await User.create({
    email: 'test@test.com',
    password: 'blah',
  });
  const account = await Account.create();
  const igAccount = await IGAccount.create();
  let post = await Post.create({
    postDate: new Date(),
    UserId: user.id,
    AccountId: account.id,
    IGAccountId: igAccount.id,
    Photo: {
      bucket: 'uploads',
      objectName: minioObj.create('v2',{ payload: true })
    }
  },{
    include: [ Photo ]
  })
  return { account, igAccount, user, post }
}

async function createAccountUserPostJob2(){

  const account = await Account.create();
  const igaccount = await IGAccount.create();

  const user = await User.create({
    email: 'test@test.com',
    password: 'blah',
  });
  let post = await Post.create({
    postDate: new Date(),
    AccountId: account.id,
    IGAccountId: igaccount.id,
    UserId: user.id,
    Photo: {
      bucket: 'uploads',
      objectName: minioObj.create('v2',{ payload: true })
    }
  },{
    include: [ Photo ]
  })
  await post.initJob();
  await post.reloadWithJob();

  return post;
}

async function createUserPostJob(){
  const user = await User.create({
    email: 'test@test.com',
    password: 'blah',
  });
  let post = await Post.create({
    postDate: new Date(),
    UserId: user.id,
    Photo: {
      bucket: 'uploads',
      objectName: minioObj.create('v2',{ payload: true })
    }
  },{
    include: [ Photo ]
  })
  await post.initJob();
  await post.reloadWithJob();

  return post;
}

module.exports =  { ezUser, fixtures, createAccountUserPostJob, createUserPostJob, createAccountUserPostJob, createAccountUserPost, exprezz }
