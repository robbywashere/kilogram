
const logger = console.log.bind(console, new Date().toISOString(),' - ');
logger.error = console.error.bind(console, new Date().toISOString(),' - ');
logger.debug = console.log.bind(console, new Date().toISOString(),' - ');

module.exports = { setLogLevel: ()=>{}, logger }
