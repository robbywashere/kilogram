const Sequelize = require('sequelize');
const config = require('config');
const dbConfig = require('./config')[config.NODE_ENV];

require('../lib/demandKeys')(dbConfig,['host','dialect','database','username'],`Invalid DB config for ENV ${config.NODE_ENV}`);

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, { 
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  operatorsAliases: false 
});

module.exports = sequelize;


