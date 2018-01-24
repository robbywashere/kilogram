const assert = require('assert');
const { User, Account } = require('../objects');
const DBSync = require('../db/sync');

describe('User object', function(){
  beforeEach(()=>DBSync(true))

  it('should create a new Account when there is no Account for User', async function(){
    await User.removeHook('afterCreate');
    const user = await User.create({
      email: 'test@test.com',
      password: 'blah',
    });
    await user.reloadWithAccounts()
    assert.equal(user.Accounts.length, 1)
  })

  it('should create a new Account when included in object', async function(){
    User.options.hooks = {}
    const user = await User.create({
      email: 'test@test.com',
      password: 'blah',
      Accounts: {}
    },{ include: Account });

    await user.reloadWithAccounts()
    assert.equal(user.Accounts.length, 1)
  })
})
