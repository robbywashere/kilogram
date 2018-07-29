const socketio = require('socket.io');
const demand = require('../lib/demand');
const express = require('express');
const { logger } = require('../lib/logger');
const { get } = require('lodash');
const Watcher = require('../db/postgres-triggers/watch');
//const Watcher = require('../server-lib/pg-listen');
const { Unauthorized } = require('http-errors');
const config = require('config');
const { IGAccount, Notification } = require('../models');

const { CookieSession } = require('../server-lib/auth/session');

/*

 TODO: Face-palm, developing sub protocol

 client:push - incoming data adheres to SocketIOPacket. shoulda typedscripted

 client:error - equiv to HTTP 4XX or 5XX, SocketIOError ??

 client:joined - client has joined a room, 'string'


*/

//TODO: Make AccountId more vague, change to ForeignKeyId

function SocketIOPacket({ data, room, event }) {
  return {
    data,
    room,
    event,
  };
}

function SocketIORoom({ AccountId, topic }) {
  return `${AccountId}#${topic}`;
}

// TODO: will probably have to class this funcition
async function PGEventSockets({ pgTriggers = [], socketApp = demand('socketApp'), debug }) {
  const watcher = new Watcher({ debug });
  await Promise.all(pgTriggers.map(trigger =>
    watcher.subscribe(trigger, ({ data }) => {
      try {

        //when migrating to mqtt
        const { AccountId } = data;
        const room = SocketIORoom({
          AccountId,
          topic: trigger.event,
        });
        socketApp.to(room).emit('client:push', data);
        //end

      } catch (e) {
        logger.error(e);
      }
    })));

  return watcher;
}

function SocketIOApp({
  socketServer = demand('socketServer'),
  sessionStrategy = demand('sessionStrategy'),
  topics = [],
}) {
  socketServer.use((socket, next) => {
    sessionStrategy.sessioner(socket.request, {}, next);
  });

  socketServer.on('connection', (socket) => {
    try {
      const user = get(socket, 'request.session.passport.user');
      if (!user) throw new Unauthorized('Unauthorized');
      // TODO, add callback after all have been join to emit 'OK'
      for (const topic of topics) {
        for (const { id: AccountId } of user.Accounts) {
          const room = SocketIORoom({ AccountId, topic });
          socket.join(room, () => {
            socket.emit('client:joined', room);
          });
        }
      }
    } catch (e) {
      socket.emit('client:error', e);
    }
  });
  return socketServer;
}

function PGSockets({
  pgTriggers = [],
  sessionStrategy = demand('sessionStrategy'),
  socketServer = demand('socketServer'),
  debug = () => {},
}) {
  const topics = pgTriggers.map(t => t.event);
  const socketApp = SocketIOApp({ socketServer, topics, sessionStrategy });
  return PGEventSockets({ pgTriggers, socketApp, debug });
}

module.exports = {
  SocketIOApp,
  SocketIORoom,
  SocketIOPacket,
  PGEventSockets,
  PGSockets,
};
