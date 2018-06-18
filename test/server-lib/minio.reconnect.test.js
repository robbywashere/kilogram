
//process.env.PORT = 8185;
process.env.NODE_ENV='test';

const baseServer = require('../../server/baseServer');

const { MClient } = require('../../server-lib/minio');
const dbSync = require('../../db/sync');
const { exec, spawn } = require('child_process');
const uuidv4 = require('uuid').v4
const config = require('config');
const assert = require('assert');
const rimraf = require('rimraf');
const minioObject = require('../../server-lib/minio/minioObject');
const Promise = require('bluebird');
const { BucketEvents, Account, Photo } = require('../../objects');
const { logger } = require('../../lib/logger');
const minioObj = require('../../server-lib/minio/minioObject');
const { get } = require('lodash');

const MINIODATADIR = './.minio-test-data';


//TODO: use sinon faketimers instead of actual timers to speed up test

function runMinio(){
  let stderr = [];
  const minio = spawn('minio', ['server', './.minio-test-data']);
  minio.stdout.on('data', (data) => {
    minio.emit('data', data);
  });

  minio.stderr.on('data', (data) => {
    stderr.push(data);
  });

  minio.once('data', ()=> minio.emit('open',{}));

  minio.on('close', (code) => {
    logger.debug(`child process exited with code ${code}`);
  });
  return minio; 
}

describe('Minio Connect and Reconnect',function(){


  let minio;
  let Persistener = { Listener: { stop: ()=>{} } };


  beforeEach(()=>dbSync(true))

  afterEach(async function(){
    this.timeout(Infinity);
    try {
      if (get(Persistener,'Listener.stop')) Persistener.Listener.stop();
    } catch(e) { 
      logger.debug(e);
    }
    try {
      if (minio) { 
        //kill(minio.pid,'SIGTERM'); 
        process.kill(minio.pid);
        await new Promise((rs)=>minio.on('close', rs))
        logger.debug('END, killing spawned proc',minio.pid) 
      }
    } catch(e) {
      logger.debug('Error killing spawned proc',e)
    }
    try {
      rimraf(MINIODATADIR, done);
    } catch(e) {
      logger.debug('Error cleaning MINIODATADIR')
    }

  })

  it('Persistent Listener adapter experiment using listenPGWatcherAdapter',async function(){

    this.timeout(15*1000);

    const account = await Account.create({});

    const uuid = uuidv4();

    const objectName = minioObject.create('v4',{ AccountId: account.id, uuid });

    minio = runMinio();

    await new Promise((rs) => minio.on('open', rs) )
      .then(()=>logger.status('Minio Startup ...'))

    const minioClient = new MClient({ 
      // bucket: 'uploads',
      //     sqsArn: 'arn:minio:sqs::test:postgresql'
    });

    await minioClient.createBucket().then(()=>logger.status('Init Minio'))

    const adapter = await minioClient.listenPGWatcherAdapter();

    Persistener.Listener.stop = adapter.end;

    adapter.eventEmitter.on('notification', MClient.PhotoEvents());

    await minioClient.client.putObject('uploads', objectName, 'xxxx');

    let photo;
    while (!(photo = await Photo.findOne({ where: { objectName } }))) {
      await Promise.delay(1000);
    }

    assert.equal(photo.objectName, objectName);



  });

  it('Persistent Listener adapter experiment using listenMinioAdapter',async function(){

    this.timeout(35*1000);

    const account = await Account.create({});

    minio = runMinio();

    await new Promise((rs) => minio.on('open', rs) )
      .then(()=>logger.status('Minio Startup ...'))

    const minioClient = new MClient();


    await minioClient.createBucket().then(()=>logger.status('Init Minio'))

    const adapter = await minioClient.listenMinioAdapter();

    Persistener.Listener.stop = adapter.end;

    adapter.eventEmitter.on('notification',MClient.PhotoEvents());

    const objectName = minioObj.create('v4',{ AccountId: account.id });

    await minioClient.client.putObject('uploads', objectName,'X');

    await Promise.delay(3000);

    const photo = await Photo.findOne({ where: { objectName } });

    assert.equal(photo.objectName, objectName);

  });


  it('Should persist Minio Event Listeners and Connection',async function(){

    this.timeout(35*1000);

    const account = await Account.create({});

    minio = runMinio();

    await new Promise((rs) => minio.on('open', rs) )
      .then(()=>logger.status('Minio Startup ...'))

    const minioClient = new MClient();

    await minioClient.createBucket().then(()=>logger.status('Init Minio'))

    Persistener = minioClient.listenPersist({ events: MClient.PhotoEvents() });

    logger.status('Killing Minio ....');

    process.nextTick(()=>process.kill(minio.pid));

    await new Promise((rs)=>minio.on('close', rs))
      .then(()=>logger.status('Minio exited'))

    minio = runMinio();

    await new Promise((rs) => minio.on('open', rs) )
      .then(()=>logger.status('Minio Startup ...'))

    await Promise.delay(5000)

    await minioClient.createBucket().then(()=>logger.status('Init Minio'))

    const objectName = minioObj.create('v4',{ AccountId: account.id });

    await minioClient.client.putObject('uploads', objectName,'X');

    await Promise.delay(5000)

    const photo = await Photo.findOne({ where: { objectName } });

    assert.equal(photo.objectName, objectName);

    delete minioClient;

    Persistener.listener.stop();

    await Promise.delay(1000)

    process.nextTick(()=>process.kill(minio.pid));

    await new Promise((rs)=>minio.on('close', rs))
      .then(()=>logger.status('Minio exited'))

  })
});
