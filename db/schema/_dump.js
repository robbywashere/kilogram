const { pgSchemaDumpFile, getSchemaPath } = require('./pgDumpSchema');
const dbConfig = require('../config');
const dbSync = require('../sync');
const { logger } = require('../../lib/logger');
const config = require('config');
const path = require('path');

(async function dump() {
  try {
    await dbSync(true);
    const schemaPath = getSchemaPath();
    const { username, database } = dbConfig.development;
    await pgSchemaDumpFile({ path: schemaPath, username, database });
    process.exit(0);
  } catch (e) {
    logger.error(e);
    throw e;
  }
}());
