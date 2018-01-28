const express = require('express');
const { chunk, get } = require('lodash');
const { parse } = require('url');
const fs = require('fs');
const config = require('config');
const { logger } = require('./lib/logger');
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

//app.use(helmet());

app.use(corsHeaders);

app.use(require('body-parser').json());

app.use(Auth(app));

app.use(require('serve-static')(__dirname + '/public'));

initController({
  app,
  sequelize: DB
})


const mc = new MClient();

app.get('/force-logout',(req,res)=>{ req.logout(); res.send('logout'); }) //TODO: this is only for testing purposes

app.use('/minio',Routes({ client: mc }));

app.get('/upload', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})




Promise.all([syncDb(false), mc.init() ]).then(function(){
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


