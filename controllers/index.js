
const { BucketEvents, Device, Job, Post, User, IGAccount, BotchedJob } = require('./objects');

const Objects = require('./objects');

const finale = require('finale-rest');

module.exports = function({ app, sequelize }){
  finale.initialize({
    app,
    sequelize
  })
  Object.keys(Objects).forEach(k=> finale.resource({ model: Objects[k] }))
  return app;
}

