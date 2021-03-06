const SyncDb = require('../db/sync');
const initController = require('../controllers');
const DB = require('../db');
const express = require('express');
// const JWTAuth = require('./server-lib/auth/jwt');
const config = require('config');
const Auth = require('../server-lib/auth');
const { CookieSessionClass, PGSessionClass } = require('../server-lib/auth/session');
const helmet = require('helmet');
const { logger } = require('../lib/logger');
const { MClient } = require('../server-lib/minio');
const serverErrors = require('./serverErrors');

module.exports = async function ({
  minioClient = new MClient(),
  auth = Auth,
  syncDb = SyncDb,
  sessionStrategy = new CookieSessionClass({ secret: config.get('APP_SECRET') }),
  errorMiddleware = serverErrors,
  app = express(),
  sequelize = DB,
} = {}) {
  try {
    logger.debug('Loading static middlewares and body-parser');

    app.use(require('body-parser').json());

    app.use(require('serve-static')(`${__dirname}/public`));

    logger.debug('Loading auth');

    app.use(auth(app, { sessionStrategy }));

    logger.debug('Initializing controllers');

    initController({
      app,
      minioClient,
      sequelize: DB,
    });

    logger.debug('Loading error middleware');

    app.use(errorMiddleware);

    logger.debug('Syncing DB and initializing minioClient');

    await syncDb(false);

    app.set('minio event listener',(await minioClient.init()));

    return app;
  } catch (e) {
    logger.critical('Failed to start server!', e); // TODO: all .critical logged errors should send email/notification to admin
    throw e;
  }
};
