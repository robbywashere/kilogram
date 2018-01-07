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

const init = Promise.all([syncDb(false), mc.init() ])

module.exports = { app, init }
