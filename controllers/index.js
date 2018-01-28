
const { BucketEvents, Device, Job, Post, User, IGAccount, BotchedJob } = require('../objects');

const Objects = require('../objects');

const finale = require('finale-rest');

const { isArray, fromPairs } = require('lodash');

const { logger } = require('../lib/logger');

const { slurpDir2, excludeIndex } = require('../lib/slurpDir2');

const { pick, get } = require('lodash');

const config = require('config');

const { ForbiddenError, FinaleError } = require('finale-rest').Errors;

const DB = require('../db');


function AddRequireUser(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(function(req, res, context){
      if (typeof req.user === "undefined") {
        throw new ForbiddenError(); 
      }
      return context.continue
    })
  })

}
function AddSetPolicy(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].send.before(function(req, res, context){
      if (isArray(context.instance)) {
        context.instance.map(i=>i.setPolicy(action, req.user))
      }
      else {
        context.instance.setPolicy(action, req.user)
      }
      return context.continue;
    })
  })

}

function AddAuth(resource){
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(function(req,res, context){
      if (!context.model.authorize(action, req.user)) {
        throw new ForbiddenError(); 
      }
      return context.continue;
    }
    )
  })
}

function AddInstanceAuthorize(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].fetch.after(function(req,res, context){
      if (isArray(context.instance) && context.instance.some(i=>!i.authorize(action, req.user))) { //TODO: promise support
        throw new ForbiddenError(); 
      }
      else if (!isArray(context.instance) && !context.instance.authorize(action, req.user)) { //TODO: promise support
        throw new ForbiddenError(); 
      }
      return context.continue
    })
  })

}
function AddPolicyAttributes2(resource) { //this relies on the setPolicy and toJSON

  ['delete','update','create'].forEach(action => {
    resource[action].start(function(req,res, context){
      const attrs = context.model.getPolicyAttrs(action, req.user);
      if (attrs) {
        context.options.attributes = attrs; 
        req.body = pick(req.body,attrs) //TODO consider the security implications of this
      }
      return context.continue;
    })
  });
}




function AddPolicyAttributes(resource) {

  ['delete','update','create'].forEach(action => {
    resource[action].start(function(req,res, context){
      const attrs = context.model.getPolicyAttrs(action, req.user);
      if (attrs) {

        context.options.attributes = attrs; 
        req.body = pick(req.body,attrs) //TODO consider the security implications of this

      }
      return context.continue;
    })
  });

}


function AddPolicyScope(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(function(req,res, context){
      context.model = context.model.policyScope(action, req.user);
      return context.continue;
    })
  })
}


function loadPath(app) {
  return (path) => {
    const name = get(get(path.split('/').splice(-1), 0).split('.'),0)
    const controller = require(path);
    app.use(`/${name}`, controller);
  }
}

function AddErrorHandler(resource) {


  ['list','read','delete','update','create'].forEach(action => {

    resource.controllers[action].error = function(req, res, error) {


      if (!(error instanceof FinaleError)) {
        logger.critical(error);
      }  else if (config.NODE_ENV === 'development') { 
        console.error(error) 
      } else {
        error.ip = req.ip;
        logger.error(JSON.stringify(error,null,4)) 
      }

      res.status(error.status);
      res.json({
        message: error.message,
        errors: error.errors
      });
    };

  });
}



function AddMiddlewares(resource){ 
  AddAuth(resource)
  AddSetPolicy(resource);
  AddPolicyScope(resource);
  AddPolicyAttributes2(resource);
  AddInstanceAuthorize(resource);
  AddErrorHandler(resource);
}

function Init({ app, sequelize = DB, objects = Objects }){
  loadObjectControllers({ app, sequelize, objects })
  loadPathControllers(app);
  return app;
}
Init.loadPathControllers = loadPathControllers;
function loadPathControllers(app){
  slurpDir2(__dirname, excludeIndex)(loadPath(app));
}

Init.loadObjectControllers = loadObjectControllers
function loadObjectControllers({app, sequelize = DB, objects = Objects}) {

  finale.initialize({
    //TODO: base: 'api' ???
    app,
    sequelize
  })

  Object.keys(objects).map(k=> {
    const resource = finale.resource({ model: objects[k] });
    if (objects[k]._policyAssert) {
      AddMiddlewares(resource);
    }
  });


}



module.exports = Init;

