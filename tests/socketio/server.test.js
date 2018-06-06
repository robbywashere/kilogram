const http = require('http');
const assert = require('assert');
const dbSync = require('../../db/sync');
const request = require('request-promise');
const ffport = require('find-free-port');
const ioC = require('socket.io-client');
const express = require('express');
const { ezUserAccount } = require('../helpers');
const { Notification } = require('../../objects');
const io = require('socket.io');
const { CookieSession, PGSession } = require('../../server-lib/auth/session');
const Auth = require('../../server-lib/auth');

const {
  PGEventSockets, SocketIORoom, SocketIOPayload, SocketIOApp, PGSockets,
} = require('../../socketio');

describe.only('socketio driven live server push', () => {
  let watcher;

  beforeEach(() => dbSync(true));
  afterEach(async () => {
    if (watcher){
      await watcher.disconnect(); 
    }
  })

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

  const appSecret = 's3cr3t';

  const sessionStrategy = CookieSession;

  app.use(Auth(app, { appSecret, sessionStrategy }));

  const server = http.Server(app);

  const ioServer = io(server);


  watcher = await PGSockets({ 
    pgTriggers: [
      Notification.TableTriggers.after_insert
    ],
    sessionStrategy,
    ioServer
  })

  //functions more as an app with a middleware for authentication
  const ioApp = SocketIOApp({
    ioServer,
    sessionStrategy,
    appSecret,
    topics: [
      Notification.TableTriggers.after_insert.event
    ],
  });



  app.get('/', (req, res) => res.send('OK'));

  await new Promise(rs => server.listen(freePort, rs));

  const res = await request(HOME);

  assert.equal(res, 'OK', 'express app GET /');

  const user = await ezUserAccount({ email: 'foo@bar.com', password: 'foobar' });
  const user2 = await ezUserAccount({ email: 'foo2@bar.com', password: 'foobar2' });

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
    jar2,
  });

  console.log({ r1, r2 })

  // const socket1 = ioC(HOME);

  // const err = await new Promise(rs => socket1.on('client:error', rs));

  //assert.deepEqual(err, { message: 'Unauthorized' });

  const userSocket = ioC(HOME, {
    forceNew: true,
    transportOptions: {
      polling: {
        extraHeaders: {
          Cookie: jar.getCookieString(`${HOME}/auth`),
        },
      },
    },
  });


  const userSocket2 = ioC(HOME, {
    forceNew: true,
    transportOptions: {
      polling: {
        extraHeaders: {
          Cookie: jar2.getCookieString(`${HOME}/auth`),
        },
      },
    },
  });

  const sockJoin = new Promise(rs => userSocket.on('client:joined', rs));

  await new Promise(rs => userSocket.on('connect', rs));

  assert(userSocket.id);

  // const sockJoin2 = new Promise(rs => userSocket2.on('client:joined', rs));

  await new Promise(rs => userSocket2.on('connect', rs));

  assert(userSocket2.id);

  /*const userAccountRoom1 = SocketIORoom({
    AccountId: user.Accounts[0].id,
    topic: Notification.TableTriggers.after_insert.event,
  });

  const sockResp = new Promise(rs => userSocket.on('client:push', rs));
  ioServer.to(userAccountRoom1).emit('client:push', { hello: 'world' });
  assert.deepEqual({ hello: 'world' }, (await sockResp));
  assert.equal((await sockJoin),userAccountRoom1);*/


  const user1sockResp = new Promise(rs => userSocket.on('client:push', rs));
  const user2sockResp = new Promise(rs => userSocket2.on('client:push', rs));

  await Notification.create({ 
    body: { msg: 'hello user 1' },
    AccountId: user.Accounts[0].id,
  })
  await Notification.create({ 
    body: { msg: 'hello user 2' },
    AccountId: user2.Accounts[0].id,
  })

  const resUser1 = (await user1sockResp);
  
  assert.deepEqual(resUser1.body,{ msg: 'hello user 1' });


  // const resUser2 = (await user2sockResp);
  //assert.deepEqual(resUser2.body,{ msg: 'hello user 2' });


}).timeout(5000);



});

