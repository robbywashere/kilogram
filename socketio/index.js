const socketio = require('socketio');
const { logger } = require('../lib/logger');
const { get } = require('lodash');
const { Unauthorized } = require('http-errors')
const { IGAccount, Notification } = require('../objects');

const { CookieSession } = require('../server-lib/auth/session');



/*

const pgTriggers = [
  Notification.TableTriggers.after_insert,
  IGAccount.Triggerables.status
];


const topics = pgTriggers.map(t=>t.event);

const socketServer = SocketIOServer({ httpServer, topics })

await PGEventSockets({ pgTriggers, socketServer  });



*/


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

function PGSockets({ pgTriggers, httpServer }) {

  const topics = pgTriggers.map(t=>t.event);

  const socketServer = SocketIOServer({ httpServer, topics })

  return PGEventSockets({ pgTriggers, socketServer  });

}

function SocketIOServer({ 
  httpServer,
  sessionStrategy = CookieSession,
  topics = []
}) {
  const io = socketio(httpServer);
  io.use(function(socket,next){
    sessionStrategy.sessioner(socket.request,{},next);
  }); 
  io.on('connection',function(socket){
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

module.exports = { SocketIOServer, PGEventSockets, PGSockets }

