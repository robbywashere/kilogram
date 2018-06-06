const socketio = require('socket.io');
const express = require('express');
const { logger } = require('../lib/logger');
const { get } = require('lodash');
const Watcher = require('../db/trigger-notify/watch');
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


function SocketIOPacket({ data, room, event }) {
  return {
    data, room, event,
  };
}


function SocketIORoom({ AccountId, topic }) {
  return `${AccountId}#${topic}`;
}


// TODO: will probably have to class this funcition
async function PGEventSockets({
  pgTriggers,
  socketServer,
}) {
  const watcher = new Watcher({ debug: logger.debug });
  for (const trigger of pgTriggers) {
    await watcher.subscribe(trigger, ({ data }) => {
      try {
        const { AccountId } = data;
        const room = SocketIORoom({
          AccountId, topic: trigger.event,
        });
        socketServer.to(room).emit('client:push', data);
      } catch (e) {
        logger.error(e);
      }
    });
  }
  return watcher;
}


function SocketIOApp({
  ioServer,
  sessionStrategy,
  topics = [],
  appSecret = config.get('APP_SECRET'),
}) {
  // ioServer.on('error',(e)=>console.log(e));
  //

  const sessioner = sessionStrategy.sessioner({ secret: appSecret });

  ioServer.use((socket, next) => {
    console.log(socket.id)
    console.log(socket.request.headers)
    sessioner(socket.request, {}, next);
  });

  ioServer.on('connection', (socket) => {
    try {
      const user = get(socket, 'request.session.passport.user');

      if (!user) throw new Unauthorized('Unauthorized');
      // TODO, add callback after all have been join to emit 'OK'
      for (const topic of topics) {
        for (const { id: AccountId } of user.Accounts) {
          const room = SocketIORoom({ AccountId, topic });
          logger.debug({ room }, socket.id);
          socket.join(room, () => {
            //  console.log({room, socket: socket.id, AccountId });
            socket.emit('client:joined', room);
          });
        }
      }
    } catch (e) {
      socket.emit('client:error', e);
    }
  });
  return ioServer;
}

function PGSockets({
  pgTriggers,
  sessionStrategy,
  ioServer,
}) {
  const topics = pgTriggers.map(t => t.event);
  const socketServer = SocketIOApp({ ioServer, topics, sessionStrategy });
  return PGEventSockets({ pgTriggers, socketServer });
}

module.exports = {
  SocketIOApp, SocketIORoom, SocketIOPacket, PGEventSockets, PGSockets,
};

