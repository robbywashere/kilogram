
const demandKeys = require('../../lib/demandKeys');
const assert = require('assert');

describe('demandKeys', () => {
  it('should require a key in obj or throw an error', () => {
    assert.throws(() => demandKeys({ a: true }, ['b']));
    assert.doesNotThrow(() => demandKeys({ a: true }, ['a']));
    try {
      demandKeys({ a: true }, ['b'], 'MSG');
    } catch (e) {
      assert.equal(e.message, 'MSG, missing b');
    }
  });
});
