const _ = require('lodash');
const DB = require('../db');
const OBJECTS = {};
const INITS = {};

const slurpDir = require('../lib/slurpDir')(__dirname);

slurpDir((object)=>{

  if (object.Init) INITS[object.Name] = object.Init;

  let definition = DB
    .define(object.Name, Object.assign({},object.Properties), { 
      tableName: object.TableName,
      validate: object.Validate,
      hooks: object.Hooks, 
      scopes: object.Scopes,
      defaultScope: object.DefaultScope
    });

  definition.$ = DB;

  // Instance Methods
  //
  Object.assign(definition.prototype, Object.assign({}, object.Methods))


  definition._scopeFns = !!object.ScopeFunctions;
  // Scopes into instance Static functions

  // Static Methods
  Object.keys(object.StaticMethods||{}).forEach(k => {
    object.StaticMethods[k].bind(definition)
  });


  Object.assign(definition, Object.assign({}, object.StaticMethods))
  OBJECTS[object.Name] = definition;
});


//load initializers
Object.keys(OBJECTS).forEach(name => {
  let object = OBJECTS[name];

  if (INITS[name]) INITS[name].bind(object)(OBJECTS);

  let scopes = _.get(object,'options.scopes');

  if (typeof scopes !== "undefined" && object._scopeFns) {
    Object.keys(scopes).forEach( k=> {
      const fn = function(opts) { return this.scope(k).findAll(opts) }
      const fnById = function(id, opts) { return this.scope(k).findById(id, opts) }
      const fnReload = function(opts) { return this.reload(scopes[k]) }
      object.prototype[ _.camelCase(`reload ${k}`)] = fnReload;
      object[k] = fn//.bind(definition);
      object[`${k}ForId`] = fnById//.bind(definition);
    })
  }

});


module.exports = OBJECTS;

