//process.env.PORT = 8185;
process.env.NODE_ENV='test';

const baseServer = require('../core/baseServer');
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
const { runMinio } = require('../tests/helpers');
const { statSync, createReadStream, readdirSync } = require('fs');
const md5File = require('md5-file');
const path = require('path');
const MINIODATADIR = './.minio-test-data';
const BUCKETPATH = path.join(MINIODATADIR, config.get('MINIO_BUCKET'));
const { main } = require('../engine');
const { logger } = require('../lib/logger');

const IGUSERNAME = config.get('TEST_IGUSERNAME');
const IGPASSWORD = config.get('TEST_IGPASSWORD');
const RUN_ON_DEVICE = config.get('RUN_E2E_ON_DEVICE');

const spaceCat = { 
  data: createReadStream(path.join(__dirname,'spacecat.jpg')),
  path: path.join(__dirname,'spacecat.jpg'),
  size: statSync(path.join(__dirname,'spacecat.jpg')).size
}

let APP;
let TIMERS = [];
let SERVER;

const Req =  function ({ path = '/', method, body = {}, ...args }) {
  return request({
    ...args,
    method,
    resolveWithFullResponse: true,
    body,
    uri: `http://localhost:${FREE_PORT}${path}`,
    json: true
  })
}

Req.post = (path,body,args)=> Req({ ...args, path, body, method: 'POST' })
Req.put = (path,body,args)=> Req({ ...args, path, body, method: 'PUT' })
Req.patch = (path,body,args)=> Req({ ...args, path, body, method: 'PATCH' })
Req.get = (path, args)=> Req({ ...args, path, method: 'GET' })

let FREE_PORT;
let PROCESS;

describe('End To End Test 👍 ',function(){


  let minio;

  beforeEach(async ()=>{


    let retry = 0;
    const fn = async ()=> {
      try {
        await dbSync(true);
      } catch(e) {
        retry++
        logger.debug('DB SYNC ERROR, retrying after 1000 ms...');
        await Promise.delay(1000);
        return false;
      }
      return true;
    }

    while(!await fn()) {
      logger.debug(`Retrying dbsync ${retry}...`)
    }

  });

  afterEach((done)=>{
    try{
      //TODO: REMOVE ME MAYBE - APP.minioEventListener.stop();
    } catch(e) { 
      logger.debug(e);
    }
    try{
      SERVER.close();
    } catch(e) { 
      logger.debug(e);
    }
    try {
      TIMERS.forEach(t=>clearTimeout(t));
    } catch(e) {
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

  it('Should signup User, Create new Post, have Post posted', async function(){

    this.timeout(Infinity);

    minio = runMinio();

    APP = await baseServer();
    const [freePort] = await ffport(3000);
    FREE_PORT = freePort;


    const jar = request.jar();

    await new Promise(R=>{
      SERVER = APP.listen(FREE_PORT,()=>{

        logger.debug(`Server listening on : ${FREE_PORT}`)
        R();
      });
    });
    logger.debug('Server Up....')


    const res1 = await Req.post('/api/user/signup',{
      email: 'testemail@email.com',
      password: 'password',
    },{ jar });

    const res2 = await Req.post('/auth',{
      username: 'testemail@email.com',
      password: 'password',
    },{ jar });

    const res3 = await Req.get('/auth',{ jar });

    assert.equal(res3.statusCode, 200);

    const AccountId = res3.body.user.Accounts[0].id

    assert(AccountId)

    logger.debug(`POST for minio url, AccountId: ${AccountId}`)

    const res4 = await Req.post('/api/minio/url',{ AccountId }, { jar })

    const { objectName, uuid, url } = res4.body;

    assert(url);

    const res5 = await request.put({
      uri: url,
      headers :{ 
        'content-type' : 'application/octet-stream',
        'content-length' : spaceCat.size,
      },
      body: spaceCat.data
    });


    assert(readdirSync(BUCKETPATH).includes(objectName));

    //await Promise.delay(1000);

    let retry = 0;
    while (!(await Photo.findAll()).length && retry++ <= 3){
      logger.debug(`try ${retry} Photo not in DB retrying in 1 sec....`);
      await Promise.delay(1000);
    }


    const photoFile = path.join(BUCKETPATH,objectName)

    const originalFileMd5 = md5File.sync(photoFile);
    const uploadFileMd5 = md5File.sync(spaceCat.path);

    assert.equal(originalFileMd5, uploadFileMd5);


    const res6 = await Req.post('/api/igaccount',{
      AccountId,
      username: IGUSERNAME,
      password: IGPASSWORD, 
    },{ jar });

    const igaccount = res6.body;

    const IGAccountId = res6.body.id;

    const res7 = await Req.post('/api/post',{
      AccountId,
      postDate: new Date(),
      IGAccountId,
      photoUUID: uuid
    }, { jar })


    const post = res7.body;

    assert(post.id);

    await PostJob.initPostJobs();

    const jobs  = await PostJob.outstanding();

    assert(jobs.length,1);

    if (!RUN_ON_DEVICE) {
      const doJob = await (await PostJob.popJob()).denormalize();
      const fullJob = doJob.toJSON();
      assert.equal(fullJob.Post.id,post.id);
      assert.equal(fullJob.IGAccount.username,igaccount.username);
      assert.equal(fullJob.IGAccount.id,igaccount.id);
      assert.equal(fullJob.Post.Photo.objectName, objectName);

    }
    else {
      await new Promise(async (resolve,reject)=>{
        try {
          TIMERS = main(); 
          while (!(await Device.findAll()).length) {
            logger.debug('Waiting for device .....')
            await Promise.delay(1000);
          }
          const devices = await Device.findAll();
          await devices[0].update({ enabled: true });
          while(!(await PostJob.completed()).length) {
            await Promise.delay(5000);
          }
          TIMERS.forEach(t=>clearInterval(t));
          resolve();
        }
        catch(e) {
          reject(e); 
        }
      });
    }
  })
})
