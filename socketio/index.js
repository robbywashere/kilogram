const socketio = require('socketio');
const { logger } = require('../lib/logger');
const { get } = require('lodash');
const { Unauthorized } = require('http-errors')
const { IGAccount, Notification } = require('../objects');

const { CookieSession } = require('../server-lib/auth/session');


function room({ AccountId, topic }) {
  return `${AccountId}#${topic}`
}

async function PGEventSockets({
  pgTriggers,
  socketServer,
  emitEvent = 'push',
}) {
  const watcher = new Watcher({ debug: logger.debug });
  await watcher.connect();
  for (let { event: topic } of pgTriggers) {
    await watcher.subscribe(trig, function({ data }){
      try {
        const { AccountId } = data;
        socketServer.to(room({ AccountId, topic })).emit(emitEvent,data)
      } catch(e) {
        logger.error(e);
      }
    })
  }
}


function SocketIOApp({ 
  ioServer,
  sessionStrategy,
  topics = []
}) {
  ioServer.use(function(socket,next){
    sessionStrategy.sessioner(socket.request,{},next);
  }); 
  ioServer.on('connection',function(socket){
    const user = get(socket,'request.session.passport.user');
    if (!user) throw new Unauthorized('need a login cuz.')
    //TODO, add callback after all have been join to emit 'OK'
    for (let topic of topics) {
      for (let { id: AccountId } of user.Accounts) {
        try {
          socket.join(room({ AccountId, topic }));
        } catch(e) {
          logger.error(e);
        }
      }
    }
  });
  return io;
}

function PGSockets({ pgTriggers, httpServer, sessionStrategy }) {
  const topics = pgTriggers.map(t=>t.event);
  const ioServer = socketio(httpServer);
  const socketServer = SocketIOServer({ ioServer, topics, sessionStrategy })
  return PGEventSockets({ pgTriggers, socketServer });
}

module.exports = { SocketIOServer, PGEventSockets, PGSockets }

