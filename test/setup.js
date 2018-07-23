console.log('SETTING ENVIRONMENT TO TEST ENV');

require('child_process').execFileSync('npm', ['run', 'e:test', 'db:schema:up'], {
  stdio: 'ignore',
});

const { setLogLevel } = require('../lib/logger');

NODE_CONFIG_ENV = 'test';
process.env.NODE_ENV = 'test';
const config = require('config');

config.NODE_ENV = 'test';
