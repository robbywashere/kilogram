before(function() {
  console.log('running global setup....');
  NODE_CONFIG_ENV='test'
  process.env.NODE_ENV='test';
  const config = require('config');
  config.NODE_ENV = 'test';
});

after(function() {
  console.log('running global teardown ...');
});
