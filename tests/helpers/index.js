const {readdirSync, readFileSync } = require('fs');
const { User, Photo, Post } = require('../../objects');
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

async function createUserPostJob(){
  const user = await User.create();
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

module.exports =  { fixtures, createUserPostJob, exprezz }
