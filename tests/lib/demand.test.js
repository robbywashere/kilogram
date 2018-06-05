const demand = require('../../lib/demand');
const assert = require('assert');

describe('demand', function(){

  it('should require a destructured function argument or throw an error', function(){

    function foo({ arg = demand('arg') }){}

    assert.throws(foo);

    assert.doesNotThrow(()=>foo({ arg: true }))
  })


})
