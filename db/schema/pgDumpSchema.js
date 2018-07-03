const { execFileSync } = require('child_process');
const { join } = require('path');
const { writeFileSync, truncateSync, readFileSync } = require('fs');
const colors = require('colors/safe');
const { dumpFunctionsReadOnly } = require('../migrateDb');
const crypto = require('crypto');
const jsdiff = require('diff');
const assert = require('assert');

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

  const upstream = (await pgSchemaDump({ username, database, name })).toString();
  const downstream = readFileSync(path).toString();
  const upstreamHash = crypto
    .createHash('md5')
    .update(upstream)
    .digest("hex");
  const downstreamHash = crypto
    .createHash('md5').
    update(downstream)
    .digest("hex"); 

  const diff = jsdiff.diffLines(downstream, upstream);

  if (diff.some(p=> (p.added || p.removed) )) {
    process.stderr.write('\n>> diff\n\n')
    diff.forEach(function(part){
      if (part.added) {
        process.stderr.write(colors['green']('+'+part.value))
      } 
      if (part.removed) {
        process.stderr.write(colors['red']('+'+part.value))
      }
    });
    process.stderr.write('\n<< end\n')

    return false
  } else {
    return true
  }


}

module.exports = { pgSchemaDump, pgSchemaDumpCompare, pgSchemaDumpFile, getSchemaPath };
