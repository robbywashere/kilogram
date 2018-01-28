
const config = require('config');
const c = require('chalk');
let LOG_LEVEL = parseInt(config.LOG_LEVEL);

const { inspect } = require('util');

function make(fn,name,level,formatter){
  return function (...msg){
    if (LOG_LEVEL >= level) {
      const inspected = msg.map(maybeObj=> (typeof maybeObj === "string") ? maybeObj : inspect(maybeObj, { colors:true, depth:null }));
      const string = `${name.toUpperCase()} : ${new Date().toISOString()}`
      fn(formatter(string, ...inspected)); 
    }
  }
}

const logger = make(console.log,'LOG',4,c.blue)
logger.debug = make(console.log,'DEBUG',3,c.yellow)
logger.status = make(console.log,'STATUS',2,c.cyan)
logger.error = make(console.error, 'ERROR',1,c.red)
logger.critical = make(console.error, 'CRITICAL',0,c.red.bold)

module.exports = { setLogLevel: (level)=> { LOG_LEVEL = level }, logger, levels: { LOG: 4, DEBUG: 3, STATUS:2, ERROR: 1, NONE: 0 } }





