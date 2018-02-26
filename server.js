const express = require('express');
const baseServer = require('./baseServer');
const config = require('config');
const { logger } = require('./lib/logger');
require('./lib/handleUnhandledRejections');

console.log(`LOG_LEVEL: ${config.get('LOG_LEVEL')}`);
baseServer().then(function(app){
  const port = config.get('PORT');
  app.listen(port, () => {
    logger.status(`Listening on ${port}\nhttp://127.0.0.1:${port}`)
  });
});



