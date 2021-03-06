const http = require('http');
const assert = require('assert');
const dbSync = require('../../db/sync');
const request = require('request-promise');
const ffport = require('find-free-port');
const ioC = require('socket.io-client');
const { logger } = require('../../lib/logger');
const express = require('express');

const helpers = require('../helpers');

const userFactory = helpers.createUserAccountIGAccountPhotoPost;
const { initJob } = helpers;

const { Notification } = require('../../models');
const io = require('socket.io');
const { CookieSessionClass, PGSessionClass } = require('../../server-lib/auth/session');
const Auth = require('../../server-lib/auth');

const {
  PGEventSockets,
  SocketIORoom,
  SocketIOPayload,
  SocketIOApp,
  PGSockets,
} = require('../../socketio');

describe('Socket socketio server pushes from postgres updates', () => {
  let watcher;

  beforeEach(() => dbSync(true));
  afterEach(async () => {
    if (watcher) {
      await watcher.disconnect();
    }
  });

  it(`\t-should establish a connection between socketio server and client
\t-should share http.Server with express
\t-should be .on(connect'ed
\t-should be authenticated using shared session strategy between socketio and express
\t-should be auto joined to account room of server established topic
\t-should recieve payload to said account channel of topic
`, async () => {
    const [freePort] = await ffport(3000);

    const HOME = `http://localhost:${freePort}`;

    const app = express();

    const secret = 's3cr3t';

    const sessionStrategy = new PGSessionClass({ secret });

    app.use(Auth(app, { sessionStrategy }));

    const server = http.Server(app);

    const socketServer = io(server);

    watcher = await PGSockets({
      pgTriggers: [Notification.TableTriggers.after_insert],
      debug: logger.debug,
      sessionStrategy,
      socketServer,
    });

    app.get('/', (req, res) => res.send('OK'));

    await new Promise(rs => server.listen(freePort, rs));

    const res = await request(HOME);

    assert.equal(res, 'OK', 'express app GET /');

    const User1Context = await userFactory({ email: 'foo@bar.com', password: 'foobar' });
    const User2Context = await userFactory({ email: 'foo2@bar.com', password: 'foobar2' });

    const user = User1Context.user;
    const user2 = User2Context.user;

    const jar = new request.jar();
    const jar2 = new request.jar();

    const r1 = await request.post({
      uri: `${HOME}/auth`,
      json: true,
      body: { username: 'foo@bar.com', password: 'foobar' },
      jar,
    });

    const r2 = await request.post({
      uri: `${HOME}/auth`,
      json: true,
      body: { username: 'foo2@bar.com', password: 'foobar2' },
      jar: jar2,
    });

    logger.debug('Authorized check');

    const socket1 = new ioC(HOME);

    const err = await new Promise(rs => socket1.on('client:error', rs));

    assert.deepEqual(err, { message: 'Unauthorized' });

    logger.debug('Unauthorized check');

    const userSocket1 = new ioC(HOME, {
      transportOptions: {
        polling: {
          extraHeaders: {
            Cookie: jar.getCookieString(`${HOME}/auth`),
          },
        },
      },
    });

    const userSocket2 = new ioC(HOME, {
      transportOptions: {
        polling: {
          extraHeaders: {
            Cookie: jar2.getCookieString(`${HOME}/auth`),
          },
        },
      },
    });

    const sockJoin = new Promise(rs => userSocket1.on('client:joined', rs));

    if (userSocket1.disconnected) await new Promise(rs => userSocket1.on('connect', rs));

    assert(userSocket1.id);

    logger.debug('User1 connect');

    if (userSocket2.disconnected) await new Promise(rs => userSocket2.on('connect', rs));

    assert(userSocket2.id);

    logger.debug('User2 connect');

    const userAccountRoom1 = SocketIORoom({
      AccountId: user.Accounts[0].id,
      topic: Notification.TableTriggers.after_insert.event,
    });

    const sockResp = new Promise(rs => userSocket1.on('client:push', rs));

    await new Promise(rs => process.nextTick(rs));

    socketServer.to(userAccountRoom1).emit('client:push', { hello: 'world' });

    logger.debug(`emit to ${userAccountRoom1} client:push`);

    assert.deepEqual({ hello: 'world' }, await sockResp);

    logger.debug('User1 client:push OK');

    assert.equal(await sockJoin, userAccountRoom1);

    const user1sockResp = new Promise(rs => userSocket1.on('client:push', rs));
    const user2sockResp = new Promise(rs => userSocket2.on('client:push', rs));

    await new Promise(rs => process.nextTick(rs));

    const notif1 = await Notification.create({
      body: { msg: 'hello user 1' },
      AccountId: user.Accounts[0].id,
    });

    logger.debug('Notification User1 created');
    await Notification.create({
      body: { msg: 'hello user 2' },
      AccountId: user2.Accounts[0].id,
    });
    logger.debug('Notification User2 created');

    logger.debug('Notification User1 response await...');
    const resUser1 = await user1sockResp;

    assert.deepEqual(resUser1.body, { msg: 'hello user 1' });

    logger.debug('Notification User2 response await...');
    const resUser2 = await user2sockResp;

    assert.deepEqual(resUser2.body, { msg: 'hello user 2' });

    const user1sockpj = new Promise(rs => userSocket1.on('client:push', rs));

    const job = await initJob(User1Context.post);

    await job.update({ status: 'SUCCESS' });

    const user1pj = await user1sockpj;

    assert.equal(user1pj.body.data.PostJob.status, 'SUCCESS');
  }).timeout(5000);
});
