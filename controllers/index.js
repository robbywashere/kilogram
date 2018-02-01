
const { BucketEvents, Device, Job, Post, User, IGAccount, BotchedJob } = require('../objects');

const Objects = require('../objects');

const finale = require('finale-rest');

const { isArray, fromPairs } = require('lodash');

const { logger } = require('../lib/logger');


const demand = require('../lib/demand');

const { load, parsePaths } = require('./load');

const { pick, get } = require('lodash');

const config = require('config');

const { ForbiddenError, FinaleError } = require('finale-rest').Errors;

const Promise = require('bluebird');

const DB = require('../db');

const { isSuperAdmin } = require('../objects/_helpers');




function Init({ app, sequelize = DB, client = demand('client'), objects = Objects }){
  loadObjectControllers({ app, sequelize, objects })
  loadPathControllers({ app, client });
  return app;
}

Init.loadPathControllers = loadPathControllers;
function loadPathControllers({ app, client }){
  const paths = parsePaths(__dirname);
  load({ paths, app, client, prefix: 'api' })
}

Init.loadObjectControllers = loadObjectControllers
function loadObjectControllers({app, sequelize = DB, objects = Objects}) {
  finale.initialize({
    base: 'admin',
    app,
    sequelize
  })

  Object.keys(objects).map(k=> {
    const resource = finale.resource({ model: objects[k] });
    ['list','read','delete','update','create'].forEach(action => {
      resource[action].auth(function(req, res, context){
        if (!isSuperAdmin(req.user)) {
          throw new ForbiddenError(); 
        } 
        else {
          return context.continue();
        }
      })
    })
  });
}



module.exports = Init;

