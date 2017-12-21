const _ = require('lodash');
const DB = require('../db');
const MODELS = {};
const ASSOCS = {};

require('fs')
  .readdirSync(__dirname)
  .filter(file => !/^\.|^_|index.js/.test(file))
  .forEach((file) => {
    const model = require(`./${file}`);

    if (model.Associate) ASSOCS[model.Name] = model.Associate;

    let definition = DB
      .define(model.Name, Object.assign({},model.Properties), { hooks: model.Hooks });

    // Instance Methods
    Object.assign(definition.prototype, Object.assign({}, model.Methods))

    // Static Methods
    Object.keys(model.StaticMethods||{}).forEach(k => {
      model.StaticMethods[k].bind(definition)
    });
    Object.assign(definition, Object.assign({}, model.StaticMethods))

    MODELS[model.Name] = definition;

 });
Object.keys(MODELS).forEach(name => {
  if (ASSOCS[name]) ASSOCS[name].bind(MODELS[name])(MODELS);
});


module.exports = MODELS;

