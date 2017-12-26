const express = require('express');
const { chunk } = require('lodash');
const { parse } = require('url');
const fs = require('fs');
const config = require('config');
const { logger } = require('./lib/logger');
const finale = require('finale-rest');
const DB = require('./db');
const { signedURLRoute, newClientAndBucket } = require('./server-lib/minio');
const Promise = require('bluebird');
const s2p = require('stream-to-promise');

const app = express();

const devices = require('./routes/Devices');

const { BucketEvents, Device, Job, BotchedJob } = require('./objects');
const Objects = require('./objects');

const syncDb = require('./db/sync');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Range, Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Expose-Headers", "Content-Range, Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(require('serve-static')(__dirname + '/public'));

app.use(require('body-parser').json());

finale.initialize({
  app,
  sequelize: DB
})

Object.keys(Objects).forEach(k=> finale.resource({model: Objects[k]}))

/*finale.resource({
  model: Device,
})
finale.resource({
  model: Job,
})
finale.resource({
  model: BotchedJob,
})
finale.resource({
  model: BucketEvents,
})*/

const mc = newClientAndBucket();

app.get('/x/objects', async function(req, res, next){
  const bucket = config.MINIO_BUCKET;
  try {
    const objects = await s2p(mc.listObjects(bucket));
    objects.forEach(o=>o.bucketName=bucket);
    for (let o of chunk(objects, 20)) { //<--- Fanout
      await Promise.all(o
        .map(obj => mc
          .presignedGetObject(bucket, obj.name, 30)
          .then(u=>obj.url = u)));
    }

    res.send(objects);
  } catch(e) {
    next(e);
  }
})
app.delete('/x/objects/:name', async function(req, res){
  const bucket = config.MINIO_BUCKET;
  try {
    await mc.removeObject(bucket, req.params.name)
    res.sendStatus(200);
  } catch(e) {
    next(e);
  }
});


app.use('/uploads',signedURLRoute(mc))

syncDb(false).then(function(){
  const port = config.PORT;
  app.listen(port, () => {
    logger(`Listening on ${port}\nhttp://127.0.0.1:${port}`)
  });

});

app.use(function(err, req, res, next) {
  logger.error(err);
  res.status(err.statusCode || 500)
    .send(err.msg || err.toString());
});
