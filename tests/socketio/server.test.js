const http = require('http');
const assert = require('assert');
const dbSync = require('../../db/sync');
const request = require('request-promise');
const ffport = require('find-free-port');
const ioC = require('socket.io-client');
const express = require('express');
const { ezUserAccount } = require('../helpers');
const io = require('socket.io');
const { CookieSession, PGSession } = require('../../server-lib/auth/session');
const Auth = require('../../server-lib/auth');

const { PGEventSockets, SocketIORoom, SocketIOPayload, SocketIOApp, PGSockets } = require('../../socketio');

describe.only('socketio driven live server push', () => {

  beforeEach(()=>dbSync(true))

  it(`\t-should establish a connection between socketio server and client
\t-should share http.Server with express`, async () => {


  const [freePort] = await ffport(3000);

  const HOME = `http://localhost:${freePort}`;

  const app = express();

  const appSecret = 's3cr3t';

  const sessionStrategy = CookieSession;

  app.use(Auth(app, { appSecret, sessionStrategy }));

  const server = http.Server(app);

  const ioServer = io(server);

  const ioApp = SocketIOApp({ 
    ioServer, 
    sessionStrategy, 
    appSecret,
    topics: ['squirrels'] 
  });

  app.get('/', (req, res) => res.send('OK'));

  await new Promise(rs => server.listen(freePort, rs));

  const res = await request(HOME);

  assert.equal(res, 'OK', 'express app GET \'/\'');


  const user = await ezUserAccount({ email: 'foo@bar.com', password: 'foobar' });

  const jar = request.jar();

  await request.post({
    uri: `${HOME}/auth`,
    json: true,
    body: { username: 'foo@bar.com', password: 'foobar' },
    jar
  });


  const socket1 = ioC(HOME); 

  const err = await new Promise(rs=>socket1.on('client:error',rs));

  assert.deepEqual(err, { message: 'Unauthorized' });

  const socket2 = ioC(HOME,{ 
    transportOptions: {
      polling: {
        extraHeaders: {
          'Cookie': jar.getCookieString(`${HOME}/auth`)
        }
      }
    }
  });

  await new Promise(rs=>socket2.on('connect',rs));

  assert(socket2.id);

  const userRoom = SocketIORoom({
    AccountId: user.Accounts[0].id, 
    topic: 'squirrels'
  });

  //  console.log(userRoom);

  socket2.on('client:push',console.log);

  ioServer.to(userRoom).emit('client:push',{ hello: 'world' });

  await new Promise(rs=>setTimeout(rs,2000));


}).timeout(4000);

})

