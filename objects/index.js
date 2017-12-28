const _ = require('lodash');
const DB = require('../db');
const OBJECTS = {};
const ASSOCS = {};

const slurpDir = require('../lib/slurpDir')(__dirname);

slurpDir((object)=>{

  if (object.Associate) ASSOCS[object.Name] = object.Associate;

  let definition = DB
    .define(object.Name, Object.assign({},object.Properties), { 
      tableName: object.TableName,
      hooks: object.Hooks, 
      scopes: object.Scopes,
      defaultScope: object.DefaultScope
    });


  // Instance Methods
  //
  Object.assign(definition.prototype, Object.assign({}, object.Methods))

  // Scopes into instance Static functions
  if (typeof object.Scopes !== "undefined" && object.ScopeFunctions) {
    Object.keys(object.Scopes).forEach( k=> {
      const fn = function() { return this.scope(k).findAll() }
      object.StaticMethods[k] = fn.bind(definition)
    })
  }

  // Static Methods
  Object.keys(object.StaticMethods||{}).forEach(k => {

    object.StaticMethods[k].bind(definition)

  });



  Object.assign(definition, Object.assign({}, object.StaticMethods))
  definition.$ = DB;
  OBJECTS[object.Name] = definition;
});


Object.keys(OBJECTS).forEach(name => {
  if (ASSOCS[name]) ASSOCS[name].bind(OBJECTS[name])(OBJECTS);
});


module.exports = OBJECTS;

