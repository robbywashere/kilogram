
const assert = require('assert');


describe('process.env.NODE_ENV', () => {
  it('should equal \'test\'', () => {
    assert.equal(process.env.NODE_ENV, 'test');
    const config = require('config');
    assert.equal(config.NODE_ENV, 'test');
  });

  it('should only use \'test\' database', () => {
    const db = require('../db');
    const dbConfig = require('../db/config');
    assert.equal(db.config.database, dbConfig.test.database);
  });
});
