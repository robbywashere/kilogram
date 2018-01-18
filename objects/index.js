const _ = require('lodash');
const cleanObj = require('../lib/cleanObj');
const DB = require('../db');
const OBJECTS = {};
const INITS = {};
const { Model } = require('sequelize'); 

const slurpDir = require('../lib/slurpDir')(__dirname);

slurpDir((object)=>{

  if (object.Init) INITS[object.Name] = object.Init;

  let model = DB
    .define(object.Name, Object.assign({},object.Properties), { 
      tableName: object.TableName,
      validate: object.Validate,
      hooks: object.Hooks, 
      scopes: object.Scopes,
      defaultScope: object.DefaultScope
    });

  model.$ = DB;

  // Instance Methods
  //
  Object.assign(model.prototype, Object.assign({}, object.Methods))

  model.prototype.authorize = async function(user = this._user){
    if (!(await _.get(object.Policy,this._policy).permit.bind(this)(user, this.dataValues))){
      let e = new Error('Access Denied');
      e.code = 403;
      throw e;
    } 
  }

  

  //Policies
  //
  //

  model.policyScope =  function(policy, user){

    //TODO: impliment all
    const scopeName = _.get(object.PolicyScopes,policy);

    const scope = _.get(object.Scopes,scopeName);
    /*if (typeof scope === "undefined") {
      throw new Error(`Scope ${scopeName} does not exist on Object definition '${object.Name}'`)
    }*/

    if (typeof scope === "function"){
      return model.scope({method: [scopeName, user]})
    } 
    if (typeof scope === "object"){
      return model.scope(scopeName)
    }
    return model
  

  
  }

  model.prototype.policyAuthorize = function(policy, user) {
    this.setPolicy(policy,user);
    return this.authorize();
  }

  model.prototype.setPolicy = function (policy, user){
    //TODO: this could be insecure if mistaken
    if (typeof object.Policy === "undefined") {
      return this;
    }
    this._policy = policy;
    if (user) {
      this._user = user;
    }
    const walk = function(obj) {
      for (const [key, val] of Object.entries(obj.dataValues)) {
        if (val instanceof Model) {
          val.setPolicy(policy, user);
          walk(val);
        }

      }
    }
    walk(this);
    return this;
  }

  model.prototype.toJSON = function (action) { 
    const j = _.clone(
      this.get({
        plain: true
      })
    );
    if (this._policy) return cleanObj(j);
    return j;
  }


  model.prototype.getPolicyAttrs = function(){
    const attrs =_.get(_.get(object.Policy,this._policy),'attr');
    if (typeof attrs === "function") {
      return attrs(this._user, this);
    } else {
      return attrs;
    }
  }

  function attrCheck(key){
    const policyAttrs = this.getPolicyAttrs.bind(this)();
    return (typeof policyAttrs === "undefined" ||
      !this._policy || 
      policyAttrs === true ||
      typeof key !== "string" ||
      policyAttrs.includes(key)
    ) 

  }

  const oldSet = model.prototype.set;
  model.prototype.set = function(key, value, options){
    if (attrCheck.bind(this)(key)) return oldSet.bind(this)(key,value, options); 
  }

  const oldGet = model.prototype.get;
  model.prototype.get = function (key,options) {
    if (attrCheck.bind(this)(key)) return oldGet.bind(this)(key,options); 
  }








  model._scopeFns = !!object.ScopeFunctions;
  // Scopes into instance Static functions

  // Static Methods
  Object.keys(object.StaticMethods||{}).forEach(k => {
    object.StaticMethods[k].bind(model)
  });


  Object.assign(model, Object.assign({}, object.StaticMethods))
  OBJECTS[object.Name] = model;
});


//load initializers
Object.keys(OBJECTS).forEach(name => {
  let object = OBJECTS[name];

  if (INITS[name]) INITS[name].bind(object)(OBJECTS);

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

      object[k] = fn//.bind(model);
      object[`${k}ForId`] = fnById//.bind(model);
    })
  }

});



module.exports = OBJECTS;

