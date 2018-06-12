
const assert = require('assert');

const { loadObjectControllers } = require('../../controllers');

const DB = require('../../db');

const { exprezz, appLogger, ezUser } = require('../helpers');

const express = require('express');

const dbSync = require('../../db/sync');

const request = require('supertest');
const serverErrors = require('../../server/serverErrors');

const IGAccountController = require('../../controllers/igaccount');

const { User, IGAccount, Account } = require('../../objects');

describe('IGAccount Controller', () => {
  beforeEach(() => dbSync(true));
  it('should create igaccount for user, not allow igaccount creation when not member of account, not allow repeat usernames for same account', async () => {
    const user = await ezUser();

    await user.reloadWithAccounts();

    const notMyAccount = await Account.create();

    const account = user.Accounts[0];
    /*  const igAccount = await IGAccount.create({
      username: 'username',
      password: 'password',
      AccountId: account.id
    }) */


    assert(account);

    // await account.addIGAccount(igAccount);

    const app = exprezz(user);

    app.use(IGAccountController());

    app.use(serverErrors);


    const res1 = await request(app)
      .post('/')
      .send({
        username: 'username',
        password: 'password',
        AccountId: account.id,
      })
      .expect(200);

    const res3 = await request(app)
      .post('/')
      .send({
        username: 'username',
        password: 'password',
        AccountId: account.id,
      })
      .expect(400);


    assert.equal(res3.body.message, 'Validation error');

    const res2 = await request(app)
      .get('/')
      .expect(200);

    assert.equal(res2.body.length, 1);
    assert(res2.body[0].id);
    assert(!res2.body[0].password);
    assert.equal(res2.body[0].AccountId, account.id);


    const res4 = await request(app)
      .post('/')
      .send({
        username: 'username9999',
        password: 'password',
        AccountId: notMyAccount.id,
      })
      .expect(403);
  });
});
