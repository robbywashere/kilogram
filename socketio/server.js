const io = require('socketio');
const { get } = require('lodash');
const { Unauthorized } = require('http-errors')

const { CookieSession } = require('../server-lib/auth/session');

function SocketIOServer({ 
  sessionStrategy = CookieSession,
  userTopics = [],
  accountTopics = [],
}) {
  io.use(function(socket,next){
    sessionStrategy.sessioner(socket.request,{},next);
  }); 
  io.on('connection',function(socket){
    const user = get(socket,'request.session.passport.user');
    if (!user) throw new Unauthorized('need login cuz.')
    //TODO, add callback after all have been join to emit 'OK'
    for (let utopic of userTopics) {
      socket.join(`u#${utopic}#${user.id}`);
    }
    for (let atopic of accountTopics) {
      for (let account of user.Accounts) {
        socket.join(`a#${atopic}#${account.id}`);
      }
    }
  });
}

