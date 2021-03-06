// const { BucketEvents, Device, Job, Post, User, IGAccount, BotchedJob } = require('../objects');

const Objects = require('../models');

const finale = require('finale-rest');

const { isArray, fromPairs } = require('lodash');

const { logger } = require('../lib/logger');

const demand = require('../lib/demand');

const { load, parsePaths } = require('./_load');

const { ForbiddenError } = require('finale-rest').Errors;

const DB = require('../db');

const { isSuperAdmin } = require('../models/_helpers');

// TODO: once finale is removed, should be exporting routers vs injecting app

function Init({
  app, sequelize = DB, minioClient = demand('minioClient'), objects = Objects,
}) {
  loadObjectControllers({ app, sequelize, objects });
  loadPathControllers({ app, minioClient });
  return app;
}

Init.loadPathControllers = loadPathControllers;
function loadPathControllers({ app, minioClient }) {
  const paths = parsePaths(__dirname);
  load({
    paths,
    app,
    minioClient,
    prefix: 'api',
  });
}

Init.loadObjectControllers = loadObjectControllers;
function loadObjectControllers({ app, sequelize = DB, objects = Objects }) {
  finale.initialize({
    base: '/admin',
    app,
    sequelize,
  });

  Object.keys(objects).map((k) => {
    const resource = finale.resource({ model: objects[k], associations: true });

    ['list', 'read', 'delete', 'update', 'create'].forEach((action) => {
      resource[action].auth((req, res, context) => {
        if (!isSuperAdmin(req.user)) {
          throw new ForbiddenError();
        } else {
          return context.continue();
        }
      });
      resource[action].error = function (req, res, error) {
        logger.error(error);
        res.status(error.status);
        res.send(error);
      };
    });
  });
}

module.exports = Init;
