const { logger } = require('../lib/logger');

process.on('unhandledRejection', (e) => {
  try {
    logger.critical('~~ Unhandled Reject, Exiting! ~~');
    logger.critical(e.stack);
  } catch (e) {
    console.error('~~ Unhandled Reject, Exiting! ~~');
    console.error(e.stack);
  }
  //process.exit(1);
});
