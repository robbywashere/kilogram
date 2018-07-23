const express = require('express');
const http = require('http');
const baseServer = require('./baseServer');
const config = require('config');
const { logger, levels, getLogLevel } = require('../lib/logger');
require('../lib/handleUnhandledRejections');

(async () => {
  const loglevel = config.get('LOG_LEVEL');
  console.log(
    `LOG_LEVEL: ${loglevel}`,
    '~',
    Object.entries(levels)
      .reduce((p, [k, v]) => (v > loglevel ? p : [...p, k]), [])
      .join(', '),
  );

  const app = await baseServer();

  const port = config.get('PORT');

  const server = require('http').createServer(app);

  if (config.get('NODE_ENV') === 'production') {
    app.set('trust proxy', 1); // trust first proxy
  }

  try {
    await new Promise(rs => server.listen(port, rs));
  } catch (e) {
    logger.error(`Error listening server on port ${port}`);
    process.exit(1);
  }

  logger.status(`Listening on ${port}\nhttp://127.0.0.1:${port}`);
})();
