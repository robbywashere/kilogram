
const { BucketEvents, Device, Job, Post, User, IGAccount, BotchedJob } = require('../objects');

const Objects = require('../objects');

const finale = require('finale-rest');

const { isArray, fromPairs } = require('lodash');

const { logger } = require('../lib/logger');

const _ = require('lodash');


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
        context.error(e);
      }

    })
  })
}

function AddPolicyAttributes(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start.after(function(req,res, context){
      try {
        const attrs = context.model.getPolicyAttrs(action, req.user);
        if (attrs.length > 0) {
          context.options.attributes = attrs; 
          //req.body = _.pick(req.body,attrs) //TODO WTF
        }
        return context.continue;
      } catch(e){
        logger.error(e);
        context.error(e);
      }
    })

    resource[action].write.before(function(req,res, context){
      try {
        const attrs = context.model.getPolicyAttrs(action, req.user);
        if (attrs.length > 0) {
          context.options.attributes = attrs; 
          context.attributes = _.pick(context.attributes, attrs)
          req.body = _.pick(req.body,attrs) // TODO WTF
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

module.exports = function({ app, sequelize }){
  finale.initialize({
    app,
    sequelize
  })

  const resources = fromPairs(Object.keys(Objects).map(k=> {
    const resource = finale.resource({ model: Objects[k] });
    AddAuth(resource);
    AddPolicyScope(resource);
    AddPolicyAttributes(resource);

    return [ k, resource ];
  }));
  return app;
}

