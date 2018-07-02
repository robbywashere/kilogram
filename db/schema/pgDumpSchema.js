const { execFileSync } = require('child_process');
const { writeFileSync, readFileSync } = require('fs');
const crypto = require('crypto');

function pgSchemaDump({ username, database, name = 'public' }) {
  return execFileSync('pg_dump', [`--schema=${name}`,'-s','-U',username,'-d',database]);
}


function pgSchemaDumpFile({ username, database, path, name = 'public' }) {
  const output = pgSchemaDump({ username, database, name });
  writeFileSync(path, output);
}


function pgSchemaDumpCompare({ username, database, path, name = 'public' }) {
  const upstream = crypto
    .createHash('md5')
    .update(pgSchemaDump({ username, database, name }))
    .digest("hex");
  const downstream = crypto
    .createHash('md5').
    update(readFileSync(path)).digest("hex"); 
  return (upstream === downstream);
}

module.exports = { pgSchemaDump, pgSchemaDumpCompare, pgSchemaDumpFile };
