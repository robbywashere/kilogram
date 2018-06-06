const socketio = require('socket.io');
const express = require('express');
const { logger } = require('../lib/logger');
const { get } = require('lodash');
const { Unauthorized } = require('http-errors');
const config = require('config');
const { IGAccount, Notification } = require('../objects');

const { CookieSession } = require('../server-lib/auth/session');

/*

 TODO: Face-palm, developing sub protocol

 client:push - incoming data adheres to SocketIOPacket. shoulda typedscripted

 client:error - equiv to HTTP 4XX or 5XX, SocketIOError ??

 client:joined - client has joined a room, 'string'


*/


function SocketIOPacket({ data, room, event }){
  return {
    data, room, event
  };
}


function SocketIORoom({ AccountId, topic }) {
  return `${AccountId}#${topic}`;
}


async function PGEventSockets({
  pgTriggers,
  socketServer,
}) {
  const watcher = new Watcher({ debug: logger.debug });
  await watcher.connect();
  for (const { event: topic } of pgTriggers) {
    await watcher.subscribe(topic, ({ data }) => {
      try {
        const { AccountId } = data;
        socketServer.to(room({ AccountId, topic })).emit('client:push', data);
      } catch (e) {
        logger.error(e);
      }
    });
  }
}


function SocketIOApp({
  ioServer,
  sessionStrategy,
  topics = [],
  appSecret = config.get('APP_SECRET'),
  queryAuth = { enable: false, userPath: 'session.user' }
}) {
  // ioServer.on('error',(e)=>console.log(e));
  ioServer.use((socket, next) => {
    if (!queryAuth.enable) {
      sessionStrategy.sessioner({ secret: appSecret })(socket.request, {}, next);
    }
    else {
      sessionStrategy.sessioner({ secret: appSecret })(socket.request.handshake.query, {}, next);
    }
  });

  ioServer.on('connection', (socket) => {
    try {
      const user = (!queryAuth.enable) ?
        get(socket, 'request.session.passport.user')
        :
        get(get(socket, 'request.handshake.query'), queryAuth.path);

      if (!user) throw new Unauthorized('Unauthorized');
      // TODO, add callback after all have been join to emit 'OK'
      for (const topic of topics) {
        for (const { id: AccountId } of user.Accounts) {
          const room =  SocketIORoom({ AccountId, topic });
          socket.join(room, ()=> socket.emit(`client:joined`,room));
        }
      }
    } catch (e) {
      socket.emit('client:error', e);
    }
  });
  // return ?? //TODO: ???
}

function PGSockets({
  pgTriggers, httpServer, sessionStrategy, path,
}) {
  const topics = pgTriggers.map(t => t.event);
  const ioServer = socketio(httpServer, { path });
  const socketServer = SocketIOApp({ ioServer, topics, sessionStrategy });
  return PGEventSockets({ pgTriggers, socketServer });
}

module.exports = { SocketIOApp, SocketIORoom, SocketIOPacket, PGEventSockets, PGSockets };

