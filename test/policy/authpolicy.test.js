const authPolicy = require('../../controllers/lib/authPolicy');

const assert = require('assert');

// const { Forbidden, Unauthorized } = require('http-errors');

describe('auth policy', () => {
  it('should throw Unauthorized when #authorizeRequest called  with no user', () => {
    assert.throws(() => authPolicy.authorizeRequest(), Error);
  });

  it('should throw Forbidden when #authorizeRequest called with user with no accounts', () => {
    assert.throws(() => authPolicy.authorizeRequest({ user: {} }), Error);
  });

  it('should NOT throw Forbidden or Unauthorized when #authorizeRequest called with user with accounts', () => {
    assert.doesNotThrow(() => authPolicy.authorizeRequest({ user: { Accounts: [{ id: 1 }] } }));
  });
});
