require('../objects');
const config = require('config');
module.exports = (force = (config.NODE_ENV !== "production")) => require('./index').sync({ force });
