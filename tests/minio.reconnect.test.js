
//process.env.PORT = 8185;
process.env.NODE_ENV='test';

const baseServer = require('../baseServer');

const { MClient } = require('../server-lib/minio');
const dbSync = require('../db/sync');
const { exec, spawn } = require('child_process');
const config = require('config');
const assert = require('assert');
const rimraf = require('rimraf');
const Promise = require('bluebird');
const {  Account, Photo } = require('../objects');
const { logger } = require('../lib/logger');
const minioObj = require('../server-lib/minio/minioObject');

const MINIODATADIR = './.minio-test-data';
function runMinio(){
  let stderr = [];
  const minio = spawn('minio', ['server', './.minio-test-data']);
  minio.stdout.on('data', (data) => {
    minio.emit('data', data);
    //logger.debug(`stdout: ${data}`);
  });

  minio.stderr.on('data', (data) => {
    stderr.push(data);
    //console.error(`stderr: ${data}`);
  });

  minio.once('data', ()=> minio.emit('open',{}));

  minio.on('close', (code) => {
    logger.debug(`child process exited with code ${code}`);
    //if (stderr.length>0) logger.error(stderr.join("\n"));
  });
  return minio; 
}

describe.skip('Minio Connect and Reconnect',function(){


  let minio;
  let Persistener;


  beforeEach(()=>dbSync(true))

  afterEach((done)=>{
    try {
      Persistener.listener.stop();
    } catch(e) { 
      logger.debug(e);
    }
    try {
      if (minio) { 
        //kill(minio.pid,'SIGTERM'); 
        process.kill(minio.pid);
        logger.debug('END, killing spawned proc',minio.pid) 
      }
    } catch(e) {
      logger.debug('Error killing spawned proc',e)
    }
    try {
      rimraf(MINIODATADIR, done);
    } catch(e) {
      logger.debug('Error cleaning MINIODATADIR')
      done();
    }
  })

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

    await Promise.delay(5000)

    process.nextTick(()=>process.kill(minio.pid));
    
    await new Promise((rs)=>minio.on('close', rs))
      .then(()=>logger.status('Minio exited'))

  })
});
