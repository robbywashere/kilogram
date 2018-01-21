const _ = require('lodash');
const cleanObj = require('../lib/cleanObj');
const DB = require('../db');
const OBJECTS = {};
const INITS = {};
const { Model } = require('sequelize'); 
const { logger } = require('../lib/logger')

const slurpDir = require('../lib/slurpDir');

function newRegistry(){
  return {
    inits: {},
    objects: {},
  }
}

function loadObject(object, registry) {

  if (object.Init) registry.inits[object.Name] = object.Init;

  let model = DB
    .define(object.Name, Object.assign({},object.Properties), { 
      tableName: object.TableName,
      validate: object.Validate,
      hooks: object.Hooks, 
      scopes: object.Scopes,
      defaultScope: object.DefaultScope
    });

  model.$ = DB; //TODO: this.sequelize can be accessed within the static method?

  // Instance Methods
  //
  Object.assign(model.prototype, Object.assign({}, object.Methods))

    /*model.prototype.authorize = async function(user = this._user){
    if (!(await _.get(object.Policy,this._policy).permit.bind(this)(user, this.dataValues))){
      let e = new Error('Access Denied');
      e.code = 403;
      throw e;
    } 
  }*/



  //Policies
  //
  //
  //
  //

  const assertedProps = ['PolicyAttributes','PolicyScopes','Authorize'];
  if (typeof object.PolicyAssert === "undefined") {
    throw new Error(`PolicyAssert property must be either 'true' or 'false' on object ${object.Name}`)
  }

  if (object.PolicyAssert && assertedProps.map(prop=>object[prop]).some(x=> typeof x === "undefined")){
    throw new Error(`${assertedProps.join(',')} Must be defined on object ${object.Name}'s properties when PolicyAssert is 'true'`)
  }





  model.authorize = function(action, user){

    const all =_.get(object.Authorize, 'all');
    const one = _.get(object.Authorize,action);
    const authorize =  (all) ? all : one;
    if (typeof authorize === "boolean") return authorize; 
    if (typeof authorize === "function") {
      return authorize(user);
    }
    return false;

  }

  model.policyScope =  function(policy, user){

    const all =_.get(object.PolicyScopes, 'all');
    const specific = _.get(object.PolicyScopes, policy);
    //const scopeName = (all) ? all : specific;


    function callScope(scopeName, m) {
      const scopeType = typeof _.get(object.Scopes,scopeName);
      if (scopeType === "function"){
        return m.scope({method: [scopeName, user]})
      } 
      if (scopeType === "object"){
        return m.scope(scopeName)
      }
      // throw new Error(`Scope ${scopeName} is not defined on object '${object.Name}'`)
      return m
    }

    return callScope(specific,callScope(all, model));
  }

  model.getPolicyAttrs = function(policy, user){
    let result;
    function callAttrs(attrs) {
      if (typeof attrs === "undefined") return [];
      if (typeof attrs === "function") {
        result = attrs(user);
      } else {
        result =  attrs;
      }
      return (result === true) ? model.prototype.attributes : result;
    }
    const all = callAttrs(_.get(object.PolicyAttributes, 'all'));
    const specific = callAttrs(_.get(object.PolicyAttributes, policy));

    const attrArr = _.union(all,  specific)
    return attrArr;
  }

  model.prototype.policyAuthorize = function(policy, user) {
    this.setPolicy(policy,user);
    return this.authorize();
  }

  model._scopeFns = !!object.ScopeFunctions;
  // Scopes into instance Static functions

  // Static Methods
  Object.keys(object.StaticMethods||{}).forEach(k => {
    object.StaticMethods[k].bind(model)
  });


  Object.assign(model, Object.assign({}, object.StaticMethods))
  registry.objects[object.Name] = model;
  return registry;

}

function initObjects(objectRegistry) {
  Object.keys(objectRegistry.objects).forEach( name => {

    let object = objectRegistry.objects[name];

    if (objectRegistry.inits && objectRegistry.inits[name]) objectRegistry.inits[name].bind(object)(objectRegistry.objects);

    let scopes = _.get(object,'options.scopes');

    if (typeof scopes !== "undefined" && object._scopeFns) {
      Object.keys(scopes).forEach( k=> {
        let fn;
        if (typeof scopes[k] === "function") {
          fn = function(arg, opts) { return this.scope({ method: [k, arg ] }).findAll(opts) }
        }
        else {
          fn = function(opts) { return this.scope(k).findAll(opts) }
        }

        const fnById = function(id, opts) { return this.scope(k).findById(id, opts) }

        // scopes prefixed with 'with', will be givin a reload<withScope> method
        if (k.substr(0,4) === "with") {
          object.prototype[ _.camelCase(`reload ${k}`)] = function(opts) { return this.reload(scopes[k]) };
        }

        object[k] = fn.bind(object);
        object[`${k}ForId`] = fnById.bind(object);
      })
    }
  })
};

function wholeShebang(objectsDir) {
  const registry = { objects: {}, inits: {} };
  slurpDir(objectsDir)((object)=>loadObject(object, registry))
  initObjects(registry);
  return registry.objects;
}


module.exports = { loadObject, initObjects, wholeShebang, newRegistry }

