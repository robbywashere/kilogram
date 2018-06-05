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
  const client = new Client(pgConfig);
  client.connect();
  let res;
  try {
    res = await client.query(`CREATE DATABASE ${dbname}`);
    logger(`DB up ${dbname} success!`);
  } catch (err) {
    if (err && err.code === '42P04') {
      logger(`DB ${dbname} Exists ... `);
    } else if (err) {
      logger.error(err, res);
    }
  }
  client.end();
  process.exit(0);
}

async function migDown() {
  const migClient = new Client(migConfig);
  migClient.connect();
  await runMigFiles(migClient, slurpDownSql(f => [f, slurpFile(f)]));

  await migClient.end();
}
async function migUp() {
  const migClient = new Client(migConfig);
  migClient.connect();
  await runMigFiles(migClient, slurpUpSql(f => [f, slurpFile(f)]));
  await migClient.end();
}

async function down() {
  const client = new Client(pgConfig);
  let res;
  try {
    res = await client.query(`DROP DATABASE ${dbname}`);
    logger(`DB down ${dbname} success!`);
  } catch (err) {
    if (err.code === '3D000') {
      logger(`DB ${dbname} does not exists ... `);
    } else {
      logger.error(err, res);
    }
  }
  client.end();
  process.exit(0);
}

module.exports = {
  up, down, migUp, migDown,
};
