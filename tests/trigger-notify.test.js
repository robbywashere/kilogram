
const { Account, Photo, IGAccount } = require('../objects');
const dbSync = require('../db/sync');
const { delay } = require('bluebird');
const assert = require('assert');

const { logger } = require('../lib/logger');
const minioObject = require('../server-lib/minio/minioObject');
const Watcher = require('../db/trigger-notify/watch');
const PGListen = require('../server-lib/pg-listen');
const { EventEmitter } = require('events');
const uuidv4 = require('uuid').v4;

describe.only('trigger notify functionality',function(){


  let watcher = {};

  beforeEach(()=>dbSync(true));
  afterEach(()=>((typeof watcher.disconnect === "function") ? watcher.disconnect() : null))

  //TODO: move 
  it('should persist PGListen connections', async function(){

    this.timeout(8500);

    return new Promise((resolve, reject)=>{
      try {
        let allowConnect = true;
        let count = 0;

        const pgClient = class Client extends EventEmitter {
          connect(){
            count++;
            if (count === 4) {
              allowConnect = true; 
              this.on('connect',resolve);
            }
            if (allowConnect) process.nextTick(()=>this.emit('connect'));
            else {
              process.nextTick(()=>this.emit('end'));
            }
          }
        }
        const pgListener = new PGListen({ debug: true, pgClient });
        pgListener.connect();
        allowConnect = false;
        pgListener.client.emit('end');
      }
      catch(e) {
        reject(e);
      }
    });

  })

  it('should should make a table triggerable', async function(){

    this.timeout(5000);

    watcher = new Watcher({ debug: logger.debug });

    await watcher.connect();

    const photoUUID = uuidv4();

    const Q = new Promise((rs,rx) => {
      watcher.subscribe(Photo.TableTriggers.after_insert, function(payload){
        try {
          const { objectName } = payload.data;
          const { uuid } = minioObject.parse(objectName);
          assert.equal(uuid, photoUUID);
          return rs();
        } catch(e) {
          rx(e)
        }
      })
    });

    process.nextTick(async ()=> await Photo.create({ uuid: photoUUID }));

    return Q;

  })


  it('should create a Photo object on minio event', async function(){
    this.timeout(5000);
    watcher = new Watcher({ debug: logger.debug });
    await watcher.connect();
    const photoUUID = uuidv4();
    const Q = new Promise((rs,rx) => {
      watcher.subscribe(Photo.TableTriggers.after_insert, function(payload){
        try {
          const { objectName } = payload.data;
          const { uuid } = minioObject.parse(objectName);
          assert.equal(uuid, photoUUID);
          return rs();
        } catch(e) {
          rx(e)
        }
      })
    });
    process.nextTick(async ()=> await Photo.create({ uuid: photoUUID }));
    return Q;
  });


  it('should should make a table triggerable', async function(){
    this.timeout(5000);
    watcher = new Watcher({ debug: logger.debug });
    await watcher.connect();
    const photoUUID = uuidv4();
    const Q = new Promise((rs,rx) => {
      watcher.subscribe(Photo.TableTriggers.after_insert, function(payload){
        try {
          const { objectName } = payload.data;
          const { uuid } = minioObject.parse(objectName);
          assert.equal(uuid, photoUUID);
          return rs();
        } catch(e) {
          rx(e)
        }
      })
    });
    process.nextTick(async ()=> await Photo.create({ uuid: photoUUID }));
    return Q;
  });


  //TODO define a custom Object instead of using IGAccount
  it(`IGAccount object columns should be 'triggerable'`, async function(){

    this.timeout(5000);

    watcher = new Watcher({ debug: logger.debug });

    await watcher.connect();

    const account = await Account.create();

    const ig = await IGAccount.create({ 
      username: 'ribbit', 
      password: 'secret',
      AccountId: account.id
    });


    const Q = new Promise((rs,rx) => {
      watcher.subscribe(IGAccount.Triggerables.status, function(payload){
        const { data: { status, id, AccountId }} = payload;
        try {
          assert.equal(status, 'GOOD');
          assert.equal(id,ig.id);
          assert.equal(AccountId,ig.AccountId);
          return rs();
        } catch(e) {
          rx(e)
        }
      })
    });

    process.nextTick(async ()=> await ig.update({ status: 'GOOD' }));

    return Q;

  })







});
