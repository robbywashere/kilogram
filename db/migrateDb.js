const dbConfig = require('./config');

const { Client } = require('pg');

const config = require('config');

const { writeFileSync } = require('fs');


const { logger } = require('../lib/logger');

const { slurpDir2, slurpFile, forExt } = require('../lib/slurpDir2');

const pgConfig = dbConfig[config.NODE_ENV];

const dbname = pgConfig.database.toString();

const path = require('path');

const MigrationDir = path.join(__dirname,'migrations');

const FunctionDir = path.join(__dirname,'.snapshots');

const { getSchemaPath } = require('./schema/pgDumpSchema');

const { TSParser } = require('tsparser');
  
  //parse(query: string, dbType: string, delimiter: string)

const slurpFunctions = slurpDir2(FunctionDir, forExt('.function.sql')); 

const slurpUpSql = slurpDir2(MigrationDir, forExt('.up.sql'));

const slurpDownSql = slurpDir2(MigrationDir, forExt('.down.sql'));

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
    client = new Client({ ...pgConfig, database: undefined });
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

async function dumpFunctionsReadOnly({ namespace = 'public' } = {}){

  const fnquery = `SELECT f.proname, pg_get_functiondef(f.oid)
FROM pg_catalog.pg_proc f
INNER JOIN pg_catalog.pg_namespace n ON (f.pronamespace = n.oid)
WHERE n.nspname = '${namespace}' ORDER BY f.proname;`

  const client = new Client(pgConfig);

  client.connect();

  const response = await client.query(fnquery);

  return response.rows;

}
async function dumpFunctions({ namespace = 'public' } = {}){
  for (let row of (await dumpFunctionsReadOnly({ namespace }))) {
    const name = row.proname;
    let src = row.pg_get_functiondef;
    writeFileSync(path.join(__dirname,'.snapshots', `${name}.function.sql`),src);
  }
}

async function schemaUp(){
  const schemaSql = slurpFile(getSchemaPath());
  let client;
  let res;
  try {
    client = new Client(pgConfig);
    client.connect();

    for (let sqlStmt of TSParser.parse(schemaSql,'pg',';')) {
      try {
        await client.query(sqlStmt);
      } catch(E){
        logger.error(E.message);
      }
    }
    logger(`Schema up success!`);
  } catch (err) {
    logger.error(err.message);
  } finally {
    client.end();
  }
}

async function funcUp() {
  const client = new Client(pgConfig);
  client.connect();
  await runMigFiles(client, slurpFunctions(f => [f, slurpFile(f)]));
  await client.end();
}

async function migDown() {
  const client = new Client(pgConfig);
  client.connect();
  await runMigFiles(client, slurpDownSql(f => [f, slurpFile(f)]));
  await client.end();
}
async function migUp() {
  const client = new Client(pgConfig);
  client.connect();
  await runMigFiles(client, slurpUpSql(f => [f, slurpFile(f)]));
  await client.end();
}

async function down() {
  let res;
  let client;
  try {
    client = new Client({ ...pgConfig, database: undefined });
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
  up, down, migUp, migDown, schemaUp, dumpFunctions, funcUp, dumpFunctionsReadOnly
};
