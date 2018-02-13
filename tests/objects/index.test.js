
const { loadObject, initObjects, newRegistry } = require('../../server-lib/objectLoader');
const { STRING, INTEGER } = require('sequelize');
const DBSync = require('../../db/sync');
const assert = require('assert');


describe('objectLoader', function(){
  beforeEach(()=>DBSync(true));
  it ('should load an object',async function(){

    const testObj = {
      Name: 'TestObj',
      Properties:{
        foo: {
          type: STRING,
        },
        bar: {
          type: STRING,
        },
        UserId: {
          type: INTEGER
        }
      },
      ScopeFunctions: true, 
      Scopes: {
        userScoped: function(user) {
          return (user.admin) ? {} : { where: { UserId: user.id } }
        }
      },
      Hooks: {
      },
      Methods:{
      },
      StaticMethods: {
      },
      Init(){
      },
    };
    const registry = newRegistry();
    loadObject(testObj,registry)
    initObjects(registry);

    await DBSync(true);
    const { TestObj } = registry.objects;
    await TestObj.create({ foo: 'bar', bar: 'foo', UserId: 1 });
    await TestObj.create({ foo: 'blah', bar: 'blah', UserId: 2 });
    const testobj = await TestObj.findById(1);
    assert(testobj);
    //assert(TestObj.authorize('read',true));
    const empty = await TestObj.userScoped({ admin: false, id: 0 })
    assert.equal(empty.length, 0)

      /* TODO: test me with new controller
       *
    const notEmpty = await TestObj.userScoped({ admin: false, id: 1 })
    assert.equal(notEmpty.length, 1)
    assert.equal(notEmpty[0].foo,'bar')
    const ps0 = await TestObj.policyScope('all', { admin: false, id: 0 }).findOne()
    assert.equal(ps0, null)
    const ps1 = await TestObj.policyScope('all', { admin: false, id: 1 }).findOne()
    assert(ps1)
    assert.equal(ps1.foo, 'bar')
    */
  })


})



