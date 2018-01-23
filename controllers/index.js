
const { BucketEvents, Device, Job, Post, User, IGAccount, BotchedJob } = require('../objects');

const Objects = require('../objects');

const finale = require('finale-rest');

const { isArray, fromPairs } = require('lodash');

const { logger } = require('../lib/logger');

const { slurpDir2, excludeIndex } = require('../lib/slurpDir2');

const { pick, get } = require('lodash');


const { ForbiddenError } = require('finale-rest').Errors;

/*const aliases = `list index
 create new
 update edit
 delete destroy`.split("\n").map(pair=>pair.split(' ').map(item=>item.trim()).filter(x=>x))*/


function AddSetPolicy(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].send.before(function(req, res, context){
      try {
        context.instance.setPolicy(action, req.user)
        return context.continue;
      } catch(e) {
        logger.error(e);
        context.error(e);
      }
    })
  })

}

function AddAuth(resource){
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(function(req,res, context){
      try {
        //console.log(context.model.getPolicy);
        if (!context.model.authorize(action, req.user)) {
          throw new ForbiddenError(); 
        }
        return context.continue;
      } catch(e){
        logger.error(e);
        context.error(e);
      }

    })
  })
}

function AddInstanceAuthorize(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].fetch.after(function(req,res, context){
      try {
        if (isArray(context.instance) && context.instance.some(i=>!i.authorize(action, req.user))) { //TODO: promise support
          throw new ForbiddenError(); 
        }
        else if (!isArray(context.instance) && !context.instance.authorize(action, req.user)) { //TODO: promise support
          throw new ForbiddenError(); 
        }
        return context.continue
      } catch(e){
        logger.error(e);
        context.error(e);
      }

    })
  })

}


function AddPolicyAttributes(resource) {

  ['delete','update','create'].forEach(action => {
    resource[action].start.before(function(req,res, context){
      try {
          const attrs = context.model.getPolicyAttrs(action, req.user);
          if (attrs) {
            context.options.attributes = attrs; 
            req.body = pick(req.body,attrs) //TODO consider the security implications of this
          }
        return context.continue;
      } catch(e){
        logger.error(e);
        context.error(e);
      }
    })
  });

  ['list','read'].forEach(action => {
    resource[action].send.before(function(req,res, context){
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
        logger.error(e);
        context.error(e);
      }
    })
  })
}


function AddPolicyScope(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(function(req,res, context){
      try {
        context.model = context.model.policyScope(action, req.user);
        return context.skip;
      } catch(e){
        logger.error(e);
        context.error(e);
      }
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




module.exports = function({ app, sequelize }){
  finale.initialize({
    //TODO: base: 'api' ???
    app,
    sequelize
  })

  const resources = fromPairs(Object.keys(Objects).map(k=> {
    const resource = finale.resource({ model: Objects[k] });
    AddAuth(resource);
    AddPolicyScope(resource);
    AddPolicyAttributes(resource);
    AddInstanceAuthorize(resource);

    return [ k, resource ];
  }));

  slurpDir2(__dirname, excludeIndex)(loadPath(app));

  return app;
}

