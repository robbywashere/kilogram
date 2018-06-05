const demand = require('../../lib/demand');
const assert = require('assert');

describe('demand', () => {
  it('should require a destructured function argument or throw an error', () => {
    function foo({ arg = demand('arg') }) {}

    assert.throws(foo);

    assert.doesNotThrow(() => foo({ arg: true }));
  });
});
