const { loadObject, initObjects, newRegistry } = require('../../models/_modelLoader');

const { STRING, INTEGER, Model } = require('sequelize');
const DBSync = require('../../db/sync');
const assert = require('assert');

describe('modelLoader', () => {
  let InitObjs = {};
  beforeEach(() => DBSync(true));

  const testObj = {
    Name: 'TestObj',
    Properties: {
      foo: {
        type: STRING,
        permit: true,
      },
      bar: {
        omit: true,
        type: STRING,
      },
      UserId: {
        type: INTEGER,
        omit: true,
      },
    },
    ScopeFunctions: true,
    Scopes: {
      userScoped(user) {
        return user.admin ? {} : { where: { UserId: user.id } };
      },
    },
    Hooks: {},
    Methods: {
      instanceMeth() {
        return true;
      },
    },
    StaticMethods: {
      staticMeth() {
        return true;
      },
    },
    Init(objs) {
      InitObjs = objs;
    },
  };
  const registry = newRegistry();
  loadObject(testObj, registry);
  initObjects(registry);
  const { TestObj } = registry.objects;

  it('should call Init() function with registry', () => {
    assert(InitObjs.TestObj.prototype instanceof Model);
  });

  it('should make instance and static methods', async () => {
    assert(TestObj.staticMeth());
    const to = await TestObj.create({});
    assert(to.instanceMeth());
  });

  it('should turn scopes into functions with ScopeFunctions: true', async () => {
    const to1 = await TestObj.create({ UserId: 1 });
    const to2 = await TestObj.create({ UserId: 2 });

    const userScopedTo = await TestObj.userScoped({ id: 2 });

    assert.equal(userScopedTo.length, 1);

    assert.equal(userScopedTo[0].UserId, 2);

    assert.equal((await TestObj.userScoped({ id: 3 })).length, 0);
  });

  it('should load an object', async () => {
    await DBSync(true);
    await TestObj.create({ foo: 'bar', bar: 'foo', UserId: 1 });
    await TestObj.create({ foo: 'blah', bar: 'blah', UserId: 2 });
    const testobj = await TestObj.findById(1);
    assert(testobj);
    const empty = await TestObj.userScoped({ admin: false, id: 0 });
    assert.equal(empty.length, 0);
  });

  it('should register omitted and permitted keys', () => {
    assert.deepEqual(TestObj.permitted, { foo: true });
    assert.deepEqual(TestObj.omitted, { bar: true, UserId: true });
  });

  it('should sanitize a JSON object based on permitted keys', () => {
    assert.deepEqual(TestObj.sanitizeParams({ foo: 'bar', bar: 'foo' }), { foo: 'bar' });
  });
  it('should set dataValues of object based on permitted keys', () => {
    const to = TestObj.build({});
    to.permittedSet({ foo: 'bar', bar: 'foo' });
    assert.deepEqual(to.toJSON(), { foo: 'bar', id: null });
  });
  it('should safely retrieve keys based on omitted using _getSafe', async () => {
    const to = TestObj.build({ foo: 'bar', bar: 'foo' });
    await to.save();
    assert.equal(to._getSafe('bar'), undefined);
    assert.equal(to._getSafe('foo'), 'bar');
  });
  it('should serialize object using omitted via _getSafe', async () => {
    const to = TestObj.build({ foo: 'bar', bar: 'foo', UserId: 1 });
    await to.save();
    const toJSON = to.serialize();
    assert.equal(toJSON.bar, undefined);
    assert.equal(toJSON.UserId, undefined);
    assert.equal(toJSON.foo, 'bar');
    assert.deepEqual(Object.keys(toJSON), ['id', 'foo', 'updatedAt', 'createdAt']);
  });
});
