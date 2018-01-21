
const config = require('config');
let LOG_LEVEL = config.LOG_LEVEL;

const logger = function(...msg) { (LOG_LEVEL >= 3) && console.log('LOG :',new Date().toISOString(),' - ', ...msg); }
logger.debug = function(...msg) { (LOG_LEVEL >= 2) && console.log('DEBUG :',new Date().toISOString(),' - ', ...msg); }
logger.error = function(...msg) { (LOG_LEVEL >= 1) && console.error('ERROR :',new Date().toISOString(),' - ', ...msg); }

module.exports = { setLogLevel: (level)=> { LOG_LEVEL = level }, logger, levels: { LOG: 3, DEBUG: 2, ERROR: 1, NONE: 0 } }
