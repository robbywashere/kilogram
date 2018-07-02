const { pgSchemaDumpCompare, getSchemaPath } = require('./pgDumpSchema');
const dbConfig = require('../config');
const dbSync = require('../sync');
const { logger } = require('../../lib/logger');
const config = require('config');
const path = require('path');

(async function dumpCompare() {
  try {
    await dbSync(true);
    const schemaPath = getSchemaPath();
    const { username, database } = dbConfig['development'];
    if (!await pgSchemaDumpCompare({ path: schemaPath, username, database })) {
      logger.error(`${schemaPath} is out-of-sync\n\nrun: $> npm run db:schema:dump`);
      process.exit(1);
    }
    process.exit(0);
  } catch(e) {
    logger.error(e);
    throw e;
  }
})();
