const { logger } = require('../lib/logger');

process.on('unhandledRejection', (e) => {
  try {
    logger.critical('~~ Unhandled Error ~~');
    logger.critical(e.stack);
  } catch (e) {
    console.error('~~ Unhandled Error ~~');
    console.error(e.stack);
  }
  process.exit(1);
  // throw e;
});
