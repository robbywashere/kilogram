require('../objects');
const config = require('config');
module.exports = (force = (config.NODE_ENV !== "production")) => {
  try {
    return require('./index').sync({ force });
  } catch(e) {
    if (e.name === 'SequelizeConnectionRefusedError') {
      console.error(`\n\n---- Error: Unable to connect to DB ----
       * Check configuration
       * Assure DB is online
      `);
    } else {
      throw e;
    }
  }
};
