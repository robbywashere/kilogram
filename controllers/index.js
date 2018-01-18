
const { BucketEvents, Device, Job, Post, User, IGAccount, BotchedJob } = require('../objects');

const Objects = require('../objects');

const finale = require('finale-rest');

const { fromPairs } = require('lodash');

const { ForbiddenError } = require('finale-rest').Errors;

const aliases = `list index
 create new
 update edit
 delete destroy`.split("\n").map(pair=>pair.split(' ').map(item=>item.trim()).filter(x=>x))


function AddAuth(resource){
  resource.all.auth(function(req, res, context){
    if (req.user) return context.continue
    else {
      throw new ForbiddenError(); 
    }
  })
  return resource;
}

function AddPolicy(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action]
  })
}
function AddPolicyScope(resource) {
  ['list','read','delete','update','create'].forEach(action => {
    resource[action].start(function(req,res, context){
      try {
        //console.log(context.model.getPolicy);
        context.model = context.model.policyScope(action, req.user);
        return context.skip;
      } catch(e){
        console.error(e);
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

    return [ k, resource ];
  }));




  /*
  const user = finale.resource({ model: User })
  //read, list, write, delete
  user.read.auth(function(req, res, context){
    if (req.user) return context.continue
    else {
      throw new ForbiddenError(); 
    }
  })
  const post = finale.resource({ model: Post })
  post.update.write(function(req, res, context){

  })
  post.list.fetch.before(function(req, res, context){
    try {
      context.instance = Post.userPosts(req.user)
      return context.continue;
    } catch(e) {
      return context.error(e);
    }
  })*/

  return app;
}

