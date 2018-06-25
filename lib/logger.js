const c = require('chalk');

let LOG_LEVEL;


const { inspect } = require('util');


const _accessor = () => ((typeof LOG_LEVEL !== 'undefined') ? LOG_LEVEL : require('config').get('LOG_LEVEL'));
function make(fn, name, level, formatter) {
  return function (...msg) {
    const log_level = _accessor();
    if (log_level >= level) {
      const inspected = msg.map(maybeObj => ((typeof maybeObj === 'string') ? maybeObj : inspect(maybeObj, { colors: true, depth: null })));
      const string = `${name.toUpperCase()} : ${new Date().toISOString()}`;
      fn(formatter(string, ...inspected));
    }
  };
}

function makeLogger(consoleLogger = console) {
  const logger = make(consoleLogger.log, 'LOG', 0, c.blue);
  logger.debug = make(consoleLogger.log, 'DEBUG', 3, c.yellow);
  logger.status = make(consoleLogger.log, 'STATUS', 2, c.cyan);
  logger.error = make(consoleLogger.error, 'ERROR', 1, c.red);
  logger.critical = make(consoleLogger.error, 'CRITICAL', 0, c.red.bold);
  return logger;
}

module.exports = {
  getLogLevel: _accessor,
  setLogLevel: (level) => { LOG_LEVEL = level; },
  logger: makeLogger(),
  makeLogger,
  levels: {
    LOG: 4, DEBUG: 3, STATUS: 2, ERROR: 1, NONE: 0,
  },
};

