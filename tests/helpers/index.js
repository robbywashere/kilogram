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

function appLogger(app) {
  app.use(function(err, req, res, next) {
    console.error('>>> express logger',err);
    res.status(err.statusCode || 500)
      .send(err.msg || err.toString());
  });
}

function exprezz(user = {}){
  const app = require('express')();
  app.use(require('body-parser').json());
  app.all('*',function(req,res,next){ 
    req.user = user;
    next();
  })
  return app;
}

function newIGAccount(user){
  return IGAccount.create({ username: 'xxx', password: 'password', AccountId: user.Accounts[0].id });
}
async function createAccountUserPostJob(){


  const user = await User.create({
    password: 'blah',
    email: 'test@test.com',
    Accounts: {},
  },{ include: [ Account ]});
  const account = user.Accounts[0];
  const photo = await Photo.create({ 
      bucket: 'uploads',
      objectName: minioObj.create('v2',{ payload: true })
  });
  const igAccount = await newIGAccount(user);
  let post = await Post.create({
    postDate: new Date(),
    UserId: user.id,
    AccountId: account.id,
    IGAccountId: igAccount.id,
    photoUUID: photo.uuid,
    Photo: photo
  })

  await post.initJob();
  await post.reloadWithJob();

  job = post.Job;
  return { account, igAccount, user, post, job }
}

function ezUser(opts,moreOpts){
  return User.create(Object.assign({
    password: 'blah',
    email: 'test@test.com',
  },opts),moreOpts)
}

function ezUserAccount(){
  return ezUser({ Accounts: {} },{ include: [ Account ]});
}

async function createAccountUserPost(){
  const user = await ezUserAccount();
  const photo = await Photo.create({ 
      bucket: 'uploads',
      objectName: minioObj.create('v2',{ payload: true })
  });
  const account = user.Accounts[0];
  const igAccount = await newIGAccount(user);
  let post = await Post.create({
    postDate: new Date(),
    UserId: user.id,
    AccountId: account.id,
    IGAccountId: igAccount.id,
    photoUUID: photo.uuid,
    PhotoId: photo.id
  })
  return { account, igAccount, user, post }
}

async function createAccountUserPostJob2(){

  const user = await ezUserAccount();
  const account = user.Accounts[0];
  const igaccount = await newIGAccount(user);
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
  const user = await ezUserAccount();
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

module.exports =  { ezUser, ezUserAccount, fixtures, createAccountUserPostJob, newIGAccount, createUserPostJob, createAccountUserPostJob, createAccountUserPost, exprezz, appLogger  }
