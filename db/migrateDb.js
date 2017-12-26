const dbConfig = require('./config');

const { Pool, Client } = require('pg')

const config = require('config');

const { logger } = require('../lib/logger');

const pgConfig = dbConfig[config.NODE_ENV];

const dbname = pgConfig.database.toString();

delete pgConfig.database;

function up(){
  const pool = new Pool(pgConfig)
  pool.query(`CREATE DATABASE ${dbname}`, (err, res) => {
    if (err && err.code === '42P04') {
      logger(`DB ${dbname} Exists ... `);
    } else if (err) { 
      logger.error(err, res)
    } else {
      logger(`DB up ${dbname} success!`)
    }
    pool.end()
  })
}

function down(){
  const pool = new Pool(pgConfig)
  pool.query(`DROP DATABASE ${dbname}`, (err, res) => {
    if (err && err.code === '3D000') {
      logger(`DB ${dbname} does not exists ... `);
    } else if (err) {
      logger.error(err, res)
    } else {
      logger(`DB down ${dbname} success!`)
    }
    pool.end()
  })
}

module.exports = { up, down };
