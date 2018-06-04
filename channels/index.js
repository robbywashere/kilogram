


//const io = require('socket.io')();
function Channel({ socketio, aclfn  }){
  const channel = socketio.of('notifications:after_insert');

  channel.on('connection', (socket) => {
    const userId = socket.request.session.passport.user;
    socket.user
  });
}
