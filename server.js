const express = require('express');
const { parse } = require('url');
const fs = require('fs');
const config = require('config');
const { logger } = require('./lib/logger');
const finale = require('finale-rest');
const DB = require('./db');
const { signedURLRoute, newClientAndBucket } = require('./server-lib/minio');

const app = express();

const devices = require('./routes/Devices');

const { Device, Job, BotchedJob } = require('./objects');

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


finale.resource({
  model: Device,
})

finale.resource({
  model: Job,
})

finale.resource({
  model: BotchedJob,
})


app.use('/uploads',signedURLRoute(newClientAndBucket()))

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
