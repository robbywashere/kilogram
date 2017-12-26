const express = require('express');
const { parse } = require('url');
const fs = require('fs');
const config = require('config');
const { logger } = require('./lib/logger');
const app = express();

const devices = require('./routes/Devices');

const syncDb = require('./db/sync');

app.use(require('serve-static')(__dirname + '/public'));

app.use(require('body-parser').json());


app.use('/devices', devices)


const port = config.PORT;
syncDb().then(function(){
  app.listen(port, () => {
    logger(`Listening on ${port}\nhttp://127.0.0.1:${port}`)
  });

});

app.use(function(err, req, res, next) {
  logger.error(err);
  res.status(err.statusCode || 500)
    .send(err.msg || err.toString());
});
