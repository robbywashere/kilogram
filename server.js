const express = require('express');
const { chunk, get } = require('lodash');
const { parse } = require('url');
const fs = require('fs');
const config = require('config');
const { logger } = require('./lib/logger');
const logServerErrors = (require('./controllers/lib/logServerErrors'))(logger.error);
const finale = require('finale-rest');
const DB = require('./db');
const Promise = require('bluebird');
const { MClient, Routes, signedURL, removeObject, listObjects } = require('./server-lib/minio');
const corsHeaders = require('./server-lib/corsHeaders');
const Auth = require('./server-lib/auth');
const helmet = require('helmet');

const app = express();

const Objects = require('./objects');

const syncDb = require('./db/sync');

const initController = require('./controllers');

app.use(helmet());
//app.use(corsHeaders);

app.use(require('body-parser').json());

app.use(Auth(app));

app.use(require('serve-static')(__dirname + '/public'));

const client = new MClient();

initController({
  app,
  client,
  sequelize: DB
})



app.get('/upload-static', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})


Promise.all([syncDb(false), client.init() ]).then(function(){
  const port = config.get('PORT');
  app.listen(port, () => {
    logger(`Listening on ${port}\nhttp://127.0.0.1:${port}`)
  });

});



app.use(function(err, req, res, next) {
  err.statusCode = (typeof get(err,'statusCode') !== "undefined") ? err.statusCode : 500;
  logServerErrors(err);
  res.status(err.statusCode)
    .send(err);
});


