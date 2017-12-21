const Sequelize = require('sequelize');
const config = require('config');
const dbConfig = require('../db/config')[config.NODE_ENV];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, { 
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  operatorsAliases: false 
});

module.exports = sequelize;


