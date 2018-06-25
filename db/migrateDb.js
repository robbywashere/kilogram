const dbConfig = require('./config');

const { Client } = require('pg');

const config = require('config');

const { logger } = require('../lib/logger');
const { slurpDir2, slurpFile, forExt } = require('../lib/slurpDir2');

const pgConfig = dbConfig[config.NODE_ENV];
const migConfig = JSON.parse(JSON.stringify(pgConfig));
const dbname = pgConfig.database.toString();
delete pgConfig.database;


const MDIR = `${__dirname}/migrations`;
const slurpUpSql = slurpDir2(MDIR, forExt('.up.sql'));
const slurpDownSql = slurpDir2(MDIR, forExt('.down.sql'));

async function runMigFiles(client, migfileArray) {
  for (const [file, msql] of migfileArray) {
    logger(`DB: ${dbname} - Executing sql file ${file}....`);
    let res;
    try {
      res = await client.query(msql);
    } catch (e) {
      logger.error(file, e, res);
    }
  }
}

async function up() {
  let client;
  let res;
  try {
    client = new Client(pgConfig);
    client.connect();
    res = await client.query(`CREATE DATABASE ${dbname}`);
    logger(`DB up ${dbname} success!`);
  } catch (err) {
    if (err && err.code === '42P04') {
      logger(`DB ${dbname} Exists ... `);
    } else if (err) {
      logger.error(err, res);
    }
  } finally {
    client.end();
  }
}

async function migDown() {
  const client = new Client(migConfig);
  client.connect();
  await runMigFiles(client, slurpDownSql(f => [f, slurpFile(f)]));
  await client.end();
}
async function migUp() {
  const client = new Client(migConfig);
  client.connect();
  await runMigFiles(client, slurpUpSql(f => [f, slurpFile(f)]));
  await client.end();
}

async function down() {
  let res;
  let client;
  try {
    client = new Client(pgConfig);
    client.connect();
    logger(`DROP DATABASE ${dbname}`);
    res = await client.query(`DROP DATABASE ${dbname}`);
    logger(`DB down ${dbname} success!`);
  } catch (err) {
    if (err.code === '3D000') {
      logger(`DB ${dbname} does not exists ... `);
    } else {
      logger.error(err, res);
    }
  }
  finally{
    client.end();
  }
}

module.exports = {
  up, down, migUp, migDown,
};
