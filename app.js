const express = require('express');
const { chunk } = require('lodash');
const { parse } = require('url');
const fs = require('fs');
const config = require('config');
const { logger } = require('./lib/logger');
const finale = require('finale-rest');
const DB = require('./db');
const Promise = require('bluebird');
const s2p = require('stream-to-promise');
const { MClient, Routes, signedURL, removeObject, listObjects } = require('./server-lib/minio');
const corsHeaders = require('./server-lib/corsHeaders');

const app = express();

const { BucketEvents, Device, Job, BotchedJob } = require('./objects');

const Objects = require('./objects');

const syncDb = require('./db/sync');

app.use(corsHeaders);

app.use(require('serve-static')(__dirname + '/public'));

app.use(require('body-parser').json());

app.use(function(err, req, res, next) {
  logger.error(err);
  res.status(err.statusCode || 500)
    .send(err.msg || err.toString());
});

finale.initialize({
  app,
  sequelize: DB
})



const mc = new MClient();

app.use('/minio',Routes({ client: mc }));

app.get('/upload', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

Object.keys(Objects).forEach(k=> finale.resource({ model: Objects[k] }))

Promise.all([syncDb(false), mc.init() ]).then(function(){
  const port = config.PORT;
  app.listen(port, () => {
    logger(`Listening on ${port}\nhttp://127.0.0.1:${port}`)
  });

});


module.exports = { app, init }
