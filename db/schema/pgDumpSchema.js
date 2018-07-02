const { execFileSync } = require('child_process');
const { join } = require('path');
const { writeFileSync, readFileSync } = require('fs');
const { dumpFunctionsReadOnly } = require('../migrateDb');
const crypto = require('crypto');

async function pgSchemaDump({ username, database, name = 'public' }) {
  let output = execFileSync('pg_dump', [`--schema=${name}`,'-s','-U',username,'-d',database]);
  for (let row of (await dumpFunctionsReadOnly({ namespace: name })) ) {
    output += "\n";
    output += row.pg_get_functiondef + ";";
  }
  return output;
}

function getSchemaPath() {
  return join(__dirname,'..','.snapshots',`schema.snapshot.sql`);
}


async function pgSchemaDumpFile({ username, database, path, name = 'public' }) {
  const output = await pgSchemaDump({ username, database, name });
  writeFileSync(path, output);
}


async function pgSchemaDumpCompare({ username, database, path, name = 'public' }) {
  const upstream = crypto
    .createHash('md5')
    .update((await pgSchemaDump({ username, database, name })))
    .digest("hex");
  const downstream = crypto
    .createHash('md5').
    update(readFileSync(path)).digest("hex"); 
  return (upstream === downstream);
}

module.exports = { pgSchemaDump, pgSchemaDumpCompare, pgSchemaDumpFile, getSchemaPath };
