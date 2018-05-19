
//process.env.PORT = 8185;
process.env.NODE_ENV='test';

const baseServer = require('../baseServer');

const { MClient } = require('../server-lib/minio');
const ffport = require('find-free-port');
const dbSync = require('../db/sync');
const { exec, spawn } = require('child_process');
const config = require('config');
const kill  = require('tree-kill');
const assert = require('assert');
const rimraf = require('rimraf');
const Promise = require('bluebird');
const request = require('request-promise');
const { PostJob, Device, Photo, IGAccount } = require('../objects');
const { statSync, createReadStream, readdirSync } = require('fs');
const md5File = require('md5-file');
const path = require('path');
const MINIODATADIR = './.minio-test-data';
const BUCKETPATH = path.join(MINIODATADIR, config.get('MINIO_BUCKET'));
const { main } = require('../engine');
const { logger } = require('../lib/logger');
const minioObj = require('../server-lib/minio/minioObject');


let APP;
let TIMERS = [];
let SERVER;



let FREE_PORT;
let PROCESS;

function runMinio(){
  //minio server "$HOME/minio-data/"
  let stderr = [];
  const minio = spawn('minio', ['server', './.minio-test-data']);
  minio.stdout.on('data', (data) => {
    logger.debug(`stdout: ${data}`);
  });

  minio.stderr.on('data', (data) => {
    stderr.push(data);
    console.error(`stderr: ${data}`);
  });

  minio.on('close', (code) => {
    logger.debug(`child process exited with code ${code}`);
    if (stderr.length>0) logger.error(stderr.join("\n"));
  });
  return minio; 
}

describe.skip('Minio Connect and Reconnect',function(){


  let minio;


  afterEach((done)=>{
    try{

      //     APP.minioEventListener.stop();

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

  it('XXXXXX',async function(){
    this.timeout(Infinity);

    minio = runMinio();

    const minioClient = new MClient();


    await minioClient.init()


    await Promise.delay(5000);

    process.kill(minio.pid);

    await Promise.delay(5000);

    minio = runMinio();

    await Promise.delay(5000);

    const name = minioObj.create('v4',{ payload: true })

    await minioClient.client.putObject('uploads', name,'XXXXXXX')
    

    await Promise.delay(9999999);



  })
});
