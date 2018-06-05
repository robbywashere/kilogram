console.log('SETTING ENVIRONMENT TO TEST ENV');
NODE_CONFIG_ENV = 'test';
process.env.NODE_ENV = 'test';
const config = require('config');

config.NODE_ENV = 'test';
