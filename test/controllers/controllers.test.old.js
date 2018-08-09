const initController = require('../../controllers');
const { MClient } = require('../../server-lib/minio');
const { loadObjectControllers } = require('../../controllers');
const { loadObject, initObjects, newRegistry } = require('../../models/_modelLoader');

const hashify = require('../../server-lib/auth/hashify');
const sync = require('../../db/sync');
const express = require('express');
const { request, exprezz, ezUser } = require('../helpers');

const { STRING, INTEGER } = require('sequelize');
const {
  Account, IGAccount, UserInvite, User, UserRecovery, Post,
} = require('../../models');
const assert = require('assert');
const { logger } = require('../../lib/logger');
const DB = require('../../db');
const { get } = require('lodash');
const Promise = require('bluebird');

describe.skip('controllers', () => {
  let TestObj;
  beforeEach(async () => {
    const testObj = {
      Name: 'TestObj',
      Properties: {
        foo: {
          type: STRING,
        },
        bar: {
          type: STRING,
        },
        UserId: {
          type: INTEGER,
        },
      },
      PolicyScopes: {
        all: 'userScoped',
      },
      AuthorizeInstance: {
        all: true,
      },
      Authorize: {
        async all(user) {
          await Promise.resolve(true);
          return get(user, 'superAdmin', false);
        },
      },
      PolicyAttributes: {
        all: ['id', 'UserId', 'foo'],
      },
      PolicyAssert: true,
      ScopeFunctions: true,
      Scopes: {
        userScoped(user) {
          return { where: { UserId: user.id } };
        },
      },
      Hooks: {},
      Methods: {},
      StaticMethods: {},
      Init() {},
    };
    const registry = newRegistry();
    loadObject(testObj, registry);
    initObjects(registry);

    await sync(true);
    TestObj = registry.objects.TestObj;
  });

  it('should throw a 403 when no user', async () => {
    const app = express();
    loadObjectControllers({ app, objects: { TestObj } });
    try {
      const res = await request(app)
        .get('/testobjs')
        .expect(403);
    } catch (e) {
      throw e;
    }
  });

  it('should 200 user and authorized', async () => {
    const user = await ezUser();
    user.set('superAdmin', true);
    await user.save();
    const app = exprezz(user);
    loadObjectControllers({ app, objects: { TestObj } });
    try {
      const res = await request(app)
        .get('/testobjs')
        .expect(200);
    } catch (e) {
      throw e;
    }
  });

  it('should only list testObjs of scoped to user with correct policy attributes', async () => {
    const user = await ezUser();
    const app = exprezz(user);
    loadObjectControllers({ app, objects: { TestObj } });
    const t1 = await TestObj.create({});
    const t2 = await TestObj.create({ UserId: user.id });
    const res = await request(app)
      .get('/testobjs/1')
      .expect(403);

    user.set('superAdmin', true);

    const res2 = await request(app)
      .get('/testobjs')
      .expect(200);

    // PolicyScope
    assert.equal(res2.body.length, 1);
    assert.deepEqual(res2.body[0].UserId, 1);

    // PolicyAttributes
    assert.deepEqual([{ id: 2, UserId: 1, foo: null }], res2.body);

    // PolicyAttributes delete update create
    //
    //

    // Because of scoping this is 404
    const res3 = await request(app)
      .put('/testobjs/1')
      .send({ foo: 'bar' })
      .expect(404);

    await t1.reload();

    assert.equal(t1.foo, null);

    const res4 = await request(app)
      .put('/testobjs/2')
      .send({ bar: 'foo' })
      .expect(200);

    assert.deepEqual(res4.body, { id: 2, UserId: 1, foo: null });

    await t1.reload();

    assert.equal(t1.bar, null);

    const res5 = await request(app)
      .put('/testobjs/2')
      .send({ foo: 'bar' })
      .expect(200);

    assert.deepEqual(res5.body, { id: 2, UserId: 1, foo: 'bar' });
  });
});

describe.skip('controllers', () => {
  beforeEach(() => sync(true));

  it('should do stuff', async () => {
    const app = express();
    app.all('*', (req, res, next) => {
      next();
    });

    const client = new MClient();
    initController({ app, sequelize: DB, client });

    try {
      const res = await request(app)
        .get('/users/2')
        .expect(403);
    } catch (e) {
      throw e;
    }
  });

  it('should authorize instances', async () => {
    const account = await Account.create();
    const igaccount = await IGAccount.create();
    const user = await ezUser({ superAdmin: false });
    // await account.addUserAs(user,'member')
    const post = await Post.create({
      postDate: new Date(),
      UserId: 1,
      IGAccountId: igaccount.id,
      AccountId: account.id,
    });
    await user.reloadWithAccounts();
    const app = exprezz(user);
    const client = new MClient();
    initController({ app, sequelize: DB, client });

    const res1 = await request(app)
      .get('/posts')
      .expect(200);

    assert.deepEqual([], res1.body);

    await account.addUserAs(user, 'member');

    await user.reloadWithAccounts();

    await request(app)
      .get('/posts')
      .expect(200);

    const res = await request(app)
      .get('/posts/1')
      .expect(200);

    assert.deepEqual(Object.keys(res.body), ['id']);
  });

  it.skip('should do post stuff', async () => {
    const user = await ezUser();
    const post = await Post.create({ postDate: new Date(), UserId: 1 });
    const app = exprezz(user);
    const client = new MClient();
    initController({ app, sequelize: DB, client });
    try {
      const res = await request(app)
        .get('/posts')
        .expect(200);
    } catch (e) {
      throw e;
    }
  });
  it('should do password recovery', async () => {
    const email = 'example@example.com';

    const user = await ezUser({ email, password: 'blah' });

    const app = exprezz(user);

    const client = new MClient();
    initController({ app, sequelize: DB, client });

    const res1 = await request(app)
      .post(`/user_recovery/${email}`)
      .expect(200);

    await user.reload();

    const newPass = 'blah2';

    const res2 = await request(app)
      .put('/user_recovery')
      .send({ password: newPass, email, passwordKey: user.passwordKey })
      .expect(200);

    await user.reload();

    assert(await user.verifyPassword(newPass));
  });

  it('should do user invite', async () => {
    const account = await Account.create({});
    const ui = await UserInvite.create({
      email: 'x@x.com',
      AccountId: account.id,
    });

    await ui.redeem();

    const user = await User.findById(ui.UserId, { include: [Account] });

    assert(user.Accounts.map(a => a.id).includes(account.id));
  });

  it.skip('>>>> ok', async () => {
    const user = await ezUser({ admin: false });
    const user2 = await ezUser({ admin: true });

    const account = await Account.create();
    const igaccount = await IGAccount.create();
    await user2.update({ fooBar: 'blah' });

    const post = await Post.create({ postDate: new Date(), UserId: 1 });

    const post2 = await Post.create({ postDate: new Date(), UserId: 2 });

    const app = exprezz(user);
    const client = new MClient();
    initController({ app, sequelize: DB, client });

    try {
      const res = await request(app)
        .put('/posts/1')
        .send({ foo: 'bar' })
        .expect(200);
      logger('PUT', res.body);
    } catch (e) {
      throw e;
    }
    try {
      const res = await request(app)
        .get('/posts')
        .expect(200);
      logger('GET', res.body);

      p = await Post.findById(1);
      logger(p.toJSON());
    } catch (e) {
      throw e;
    }
  });

  it('should add policy scopes', async () => {
    const user = await ezUser({ email: 'x@x.com' });
    const account = await Account.create();
    const igaccount = await IGAccount.create();
    const user2 = await ezUser({ email: 'y@y.com' });
    const post = await Post.create({
      AccountId: account.id,
      IGAccountId: igaccount.id,
      postDate: new Date(),
      UserId: 1,
    });
    const post2 = await Post.create({
      AccountId: account.id,
      IGAccountId: igaccount.id,
      postDate: new Date(),
      UserId: 2,
    });

    const app = express();
    await user.reloadWithAccounts();
    app.all('*', (req, res, next) => {
      req.user = user;
      next();
    });
    const client = new MClient();
    initController({ app, sequelize: DB, client });
    try {
      const res = await request(app)
        .get('/posts')
        .expect(200);
      logger(res.body);
    } catch (e) {
      throw e;
    }
  });
});
