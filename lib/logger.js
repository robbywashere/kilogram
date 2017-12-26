
const logger = console.log.bind(console, 'LOG :',new Date().toISOString(),' - ');
logger.error = console.error.bind(console, 'ERROR :',new Date().toISOString(),' - ');
logger.debug = console.log.bind(console, 'DEBUG :', new Date().toISOString(),' - ');

module.exports = { setLogLevel: ()=>{}, logger }
