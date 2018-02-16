
const authPolicy = require('../../controllers/lib/authPolicy');

const assert = require('assert');

const { Forbidden, Unauthorized } = require('http-errors');

describe('auth policy', function(){


  it('should throw Unauthorized when initialized with no user', function(){
    assert.throws(()=> new authPolicy(), Unauthorized);
  });

  it('should throw Forbidden when initialized with a user without any accounts', function(){
    assert.throws(()=> new authPolicy({ user: { } }), Forbidden);
  });

  it('should not throw Forbidden or Unauthorized when given a user with Accounts', function(){
    assert.doesNotThrow(()=> new authPolicy({ user: { Accounts: [{id: 1}] } }));
  });





})
