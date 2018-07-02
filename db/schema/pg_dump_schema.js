
const { logger } = require('../../lib/logger');
const { execFileSync } = require('child_process');
const { writeFileSync } = require('fs');


function pg_schema_dump({ username, database, path, name = 'public' }) {
  try {
    const output = execFileSync('pg_dump', [`--schema=${name}`,'-s','-U',username,'-d',database]);
    writeFileSync(path,output);
  } catch(err) {
    logger.error(err);
  }
}

module.exports = pg_schema_dump;
