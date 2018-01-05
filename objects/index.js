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

  // Scopes into instance Static functions
  if (typeof object.Scopes !== "undefined" && object.ScopeFunctions) {
    Object.keys(object.Scopes).forEach( k=> {
      const fn = function(opts) { return this.scope(k).findAll(opts) }
      const fnById = function(opts) { return this.scope(k).findById(opts) }
      object.StaticMethods[k] = fn//.bind(definition);
      object.StaticMethods[`${k}ById`] = fnById//.bind(definition);
    })
  }

  // Static Methods
  Object.keys(object.StaticMethods||{}).forEach(k => {
    object.StaticMethods[k].bind(definition)
  });


  Object.assign(definition, Object.assign({}, object.StaticMethods))
  OBJECTS[object.Name] = definition;
});


//load initializers
Object.keys(OBJECTS).forEach(name => {
  if (INITS[name]) INITS[name].bind(OBJECTS[name])(OBJECTS);

});


module.exports = OBJECTS;

