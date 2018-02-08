const { get, clone, camelCase } = require('lodash');
const cleanObj = require('../lib/cleanObj');
const DB = require('../db');
const OBJECTS = {};
const INITS = {};
const { isArray } = require('lodash');
const { Model } = require('sequelize'); 
const { logger } = require('../lib/logger')

const sequelize = require('sequelize');
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


  model._scopeFns = !!object.ScopeFunctions;
  // Scopes into instance Static functions
  //



  model.prototype._getSafe = function _getSafe(key) {
    return (get(get(object.Properties,key),'omit')) ? undefined : this.get(key)
  }

  model.sanitizeParams = function sanitizeParams(obj){
    return Object.entries(obj).reduce((p,[k,v]) =>{
      if (get(get(object.Properties,k),'permit')) p[k] = v;
      return p;
    },{})
  }

  model.prototype.permittedSet = function permittedSet(obj){
    return this.set(model.sanitizeParams(obj))
  }

  function serialize(){
    const dv = clone(this.dataValues);
    return Object.entries(dv).reduce((p,[key,value])=>{
      if (Array.isArray(value)) {
        //if array of instances or anything else
        p[key] = value.map(v => typeof v.serialize === "function" ? v.serialize() : this._getSafe(key))
      } else {
        p[key] = this._getSafe(key);
      }
      if (p[key] === undefined) delete p[key]
      return p;
    },{})
  }

  model.prototype.serialize = serialize;


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

    let scopes = get(object,'options.scopes');


    if (typeof scopes !== "undefined" && object._scopeFns) {
      Object.keys(scopes).forEach( k=> {
        let fn;
        let fnById;
        if (typeof scopes[k] === "function") {
          fn = function(arg, opts) { return this.scope({ method: [k, arg ] }).findAll(opts) }
          fnById = function(arg, id, opts) { return this.scope({ method: [k, arg ] }).findById(id, opts) }
          object[`${k}Fn`] = function(arg){ return this.scope({ method: [k, arg ] }) }
        }
        else {
          fn = function(opts) { return this.scope(k).findAll(opts) }
          fnById = function(id, opts) { return this.scope(k).findById(id, opts) }
        }


        // scopes prefixed with 'with', will be givin a reload<withScope> method
        if (k.substr(0,4) === "with") {
          object.prototype[ camelCase(`reload ${k}`)] = function(opts) { return this.reload(scopes[k]) };
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

