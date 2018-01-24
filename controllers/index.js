
const { BucketEvents, Device, Job, Post, User, IGAccount, BotchedJob } = require('../objects');

const Objects = require('../objects');

const finale = require('finale-rest');

const { isArray, fromPairs } = require('lodash');

const { logger } = require('../lib/logger');

const { slurpDir2, excludeIndex } = require('../lib/slurpDir2');

const { pick, get } = require('lodash');


const { ForbiddenError, FinaleError } = require('finale-rest').Errors;

const DB = require('../db');

/*const aliases = `list index
 create new
 update edit
 delete destroy`.split("\n").map(pair=>pair.split(' ').map(item=>item.trim()).filter(x=>x))*/


const lilLogger = (e) =>  { 
  logger.error(JSON.stringify(e,null,4)) 
};


function Handler(fn) {
  return function (req, res, context){
    try {
      return fn(req, res, context);
    } catch(e) {
      if (!(e instanceof FinaleError)) {
        logger.critical(e);
      } else {
        e.ip = req.ip;
        lilLogger(e);
      }
      context.error(e);
    }
  }
}

function AddRequireUser(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(Handler(function(req, res, context){
      if (typeof req.user === "undefined") {
        throw new ForbiddenError(); 
      }
      return context.continue
    }))
  })

}
function AddSetPolicy(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].send.before(Handler(function(req, res, context){
      if (isArray(context.instance)) {
        context.instance.map(i=>i.setPolicy(action, req.user))
      }
      else {
        context.instance.setPolicy(action, req.user)
      }
      return context.continue;
    }))
  })

}

function AddAuth(resource){
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(Handler(function(req,res, context){
      if (!context.model.authorize(action, req.user)) {
        throw new ForbiddenError(); 
      }
      return context.continue;
    })
    )
  })
}

function AddInstanceAuthorize(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].fetch.after(Handler(function(req,res, context){
      if (isArray(context.instance) && context.instance.some(i=>!i.authorize(action, req.user))) { //TODO: promise support
        throw new ForbiddenError(); 
      }
      else if (!isArray(context.instance) && !context.instance.authorize(action, req.user)) { //TODO: promise support
        throw new ForbiddenError(); 
      }
      return context.continue
    }))
  })

}
function AddPolicyAttributes2(resource) { //this relies on the setPolicy and toJSON

  ['delete','update','create'].forEach(action => {
    resource[action].start(Handler(function(req,res, context){
      try {
        const attrs = context.model.getPolicyAttrs(action, req.user);
        if (attrs) {
          context.options.attributes = attrs; 
          req.body = pick(req.body,attrs) //TODO consider the security implications of this
        }
        return context.continue;
      } catch(e){
        e.ip = req.ip;
        lilLogger(e);
        context.error(e);
      }
    }))
  });
}




function AddPolicyAttributes(resource) {

  ['delete','update','create'].forEach(action => {
    resource[action].start(Handler(function(req,res, context){
      try {
        const attrs = context.model.getPolicyAttrs(action, req.user);
        if (attrs) {

          context.options.attributes = attrs; 
          req.body = pick(req.body,attrs) //TODO consider the security implications of this

        }
        return context.continue;
      } catch(e){
        e.ip = req.ip;
        lilLogger(e);
        context.error(e);
      }
    }))
  });

  /* TODO: Overlap? ['list','read'].forEach(action => {
    resource[action].send.before(Handler(function(req,res, context){
      try {
        const attrs = context.model.getPolicyAttrs(action, req.user);
        if (attrs) {
          if (isArray(context.instance)){
            context.instance = context.instance.map(i=>i.dataValues = pick(i.dataValues,attrs));
          }
          else {
            context.instance.dataValues = pick(context.instance.dataValues,attrs);
          }
        }
        return context.continue;
      } catch(e){
        e.ip = req.ip;
        lilLogger(e);
        context.error(e);
      }
    }))
  })*/
}


function AddPolicyScope(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(Handler(function(req,res, context){
      context.model = context.model.policyScope(action, req.user);
      return context.continue;
    }))
  })
}


function loadPath(app) {
  return (path) => {
    const name = get(get(path.split('/').splice(-1), 0).split('.'),0)
    const controller = require(path);
    app.use(`/${name}`, controller);
  }
}




function Init({ app, sequelize = DB, objects = Objects }){
  loadObjectControllers({ app, sequelize, objects })
  loadControllers(app);
  return app;
}

Init.loadPathControllers = function(app){
  slurpDir2(__dirname, excludeIndex)(loadPath(app));
}

Init.loadObjectControllers = function({app, sequelize = DB, objects = Objects}) {

  finale.initialize({
    //TODO: base: 'api' ???
    app,
    sequelize
  })

  const resources = fromPairs(Object.keys(objects).map(k=> {
    const resource = finale.resource({ model: objects[k] });
    AddRequireUser(resource);
    AddAuth(resource);
    AddSetPolicy(resource);
    AddPolicyScope(resource);
    AddPolicyAttributes2(resource);
    //AddInstanceAuthorize(resource);

    return [ k, resource ];
  }));
}


module.exports = Init;

