const _ = require('lodash');
const DB = require('../db');
const OBJECTS = {};
const ASSOCS = {};

require('fs')
  .readdirSync(__dirname)
  .filter(file => !/^\.|^_|index.js/.test(file))
  .forEach((file) => {
    const object = require(`./${file}`);

    if (object.Associate) ASSOCS[object.Name] = object.Associate;

    let definition = DB
      .define(object.Name, Object.assign({},object.Properties), { hooks: object.Hooks });


    // Instance Methods
    //
    Object.assign(definition.prototype, Object.assign({}, object.Methods))

    //Sequelize instance attachment 

    // Static Methods
    //
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

