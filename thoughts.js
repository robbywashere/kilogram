//> IG Account status = Verified
//
//https://divillysausages.com/2015/07/12/an-intro-to-socket-io/
//https://www.google.com/search?q=redis+as+a+job+queue&ie=utf-8&oe=utf-8&client=firefox-b-1-ab

// > https://github.com/socketio/socket.io-emitter

`POST /api/igaccount` {
  IGAccountID: 1,
    username: '@lost.and.lost',
    AccountId: 1,
    status: 'UNVERIFIED' 
}

//https://github.com/socketio/socket.io-emitter

//>>npm i route-parser
//
//https://github.com/jksdua/redis-events/blob/master/index.js

//Namespace /IGAccounts ---- :eventanem = ig_accounts:after_update:status (may have to escape);
Socketlib.emit('watchOnce','/Account/:AccountId/IGAccount/:IGAccountID/Event/:Event', function(result){
});


Socketlib.emit('watchOnce','/event/:eventName/:account/:AccountId', function(result){


  //serverside --- mem leaks and maxListener overload??
  ////https://github.com/socketio/socket.io/blob/ac945d1eba2c0e126c6750d5eccbdb861e0abc56/docs/API.md#namespace

  const watcher = new Watcher();


  //Root Namespace
  watcher.subscribe(IGAccount.Triggerables.status,function(payload){
    const eventName = IGAccount.Triggerables.status.event;
    const { data: { status, id: IGAccountId, AccountId }} = payload;
    socketLib.broadcast.to(`room:${AccountUUID}`,eventName,payload);
  })

  //Root Namespace #2
  watcher.subscribe(IGAccount.Triggerables.status,function(payload){
    const eventName = IGAccount.Triggerables.status.event;
    const { data: { status, id: IGAccountId, AccountId }} = payload;
    socketLib.broadcast.to(`room:${AccountUUID}`,eventName,payload);
  })


  //Event Namespace --- cleaner logic is more easily tied to namespace without decoding
  //thorougytout life cycle events
  const { event } = IGAccount.Triggerables.status;
  const IGAccountStatusNSP = io.of(event);
  IGAccountStatusNSP.on('connection', async (req, socket) =>{
    //making simple here
    const AccountIds = req.user.accountIds();
    AccountIds.map(aid=>socket.join(`${aid}`));
  })
  watcher.subscribe(IGAccount.Triggerables.status,function(payload){
    const { data: { AccountId } } = payload;
    IGAccountStatusNSP.to(AccountId).emit('data',payload.data);
  })

  //-------------------- 3:20am

  //User minioObject encoder?
  //Fake Room Namespace
  //

  class

  const NSP = require('namespace');
  const RootNSP = io.of('/');

  RootNSP.on('connection', async (req, socket) =>{

    if (!req.user) socket.destroy();

    socket.on('subscribe', async (socket, payload) =>{
      const { Namespace } = payload;
      if (!NSP.get(Namespace)) socket.emit('namespace:error', 'namespace does not exist');
      NSP[Namespace].emit('subscribe',{ socket, payload });
    });
    socket.on('unsubscribe', async (socket, payload) =>{
      const { Namespace } = payload;
      if (!NSP.get(Namespace)) socket.emit('namespace:error', 'namespace does not exist');
      NSP[Namespace].emit('subscribe'{ socket, payload });
    });

    const EventName = IGAccount.Triggerables.status.event;
    watcher.subscribe({ event: EventName },function(payload){
      const { data: { AccountId } } = payload;
      RootNSP.to(`${EventName}#${AccountId}`).emit('data',payload.data);
    })






    // client connects to interested Event-Namespace, then joins room of AccountId
    // namespacing prevents client from getting events its not interested in, though possible with rooms, its more semantically friendly

    //https://jazzy.id.au/2017/08/02/socket-io.html

    //OR no namespacing and just use fancy room names


    watcher.subscribe(IGAccount.Triggerables.status,function(payload){
      const eventName = IGAccount.Triggerables.status.event;
      const { data: { status, id: IGAccountId, AccountId }} = payload;
      socketLib.broadcast.to(`/event/${eventName}/room/${AccountUUID}`,eventName,payload);
    })



    //----------------------

    //1)
    watcher.subscribe(IGAccount.Triggerables.status,function(payload){
      const eventName = IGAccount.Triggerables.status.event;
      const { data: { status, id: IGAccountId, AccountId }} = payload;
      socketLib.broadcast.to(`room:${AccountUUID}`,eventName,payload);
    })

    //2)
    watcher.subscribe(IGAccount.Triggerables.status,function(payload){
      const eventName = IGAccount.Triggerables.status.event;
      const { data: { status, id: IGAccountId, AccountId }} = payload;
      socketLib.namespace(AccountUUID).emit(eventName, payload);
    })

    //3) Doesn't work because you'd have to init the a nsp for every account on startup or something like that 
    watcher.subscribe(IGAccount.Triggerables.status,function(payload){
      const eventName = IGAccount.Triggerables.status.event;
      const { data: { status, id: IGAccountId, AccountId }} = payload;
      socketLib.namespace(`/Account/${AccountId}`).emit(`room:${eventName}`, payload);
    })


    //3)
    watcher.subscribe(IGAccount.Triggerables.status,function(payload){
      const eventName = IGAccount.Triggerables.status.event;
      const { data: { status, id: IGAccountId, AccountId }} = payload;
      socketLib.namespace(eventName).emit(IGAccountUUID, payload);
    })




