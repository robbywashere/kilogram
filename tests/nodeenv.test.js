
const assert = require('assert');

describe('process.env.NODE_ENV', function(){
  it (`should equal 'test'`, function(){
    assert.equal(process.env.NODE_ENV, 'test')
    const config = require('config');
    assert.equal(config.NODE_ENV, 'test')
  })
})
