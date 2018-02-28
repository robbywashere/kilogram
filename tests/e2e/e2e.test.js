//process.env.PORT = 8185;

const baseServer = require('../../baseServer');
const ffport = require('find-free-port');
const dbSync = require('../../db/sync');
const { exec, spawn } = require('child_process');
const config = require('config');
const kill  = require('tree-kill');
const assert = require('assert');
const rimraf = require('rimraf');
const Promise = require('bluebird');
const request = require('request-promise');
const { Job, Photo, IGAccount } = require('../../objects');
const { statSync, createReadStream, readdirSync } = require('fs');
const md5File = require('md5-file');
const path = require('path');
const MINIODATADIR = './.minio-test-data';
const BUCKETPATH = path.join(MINIODATADIR, config.get('MINIO_BUCKET'));


const spaceCat = { 
  data: createReadStream(path.join(__dirname,'spacecat.jpg')),
  path: path.join(__dirname,'spacecat.jpg'),
  size: statSync(path.join(__dirname,'spacecat.jpg')).size
}

let APP;
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

function runMinio(){
  //minio server "$HOME/minio-data/"
  //
  const minio = spawn('minio', ['server', './.minio-test-data']);
  minio.stdout.on('data', (data) => {
    //>   console.log(`stdout: ${data}`);
  });

  minio.stderr.on('data', (data) => {
    //>   console.error(`stderr: ${data}`);
  });

  minio.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
  return minio; 
}

describe('End To End Test 👍 ',function(){


  let minio;

  beforeEach(async ()=>{
  });

  afterEach((done)=>{
    try{
      APP.minioEventListener.stop();
    } catch(e) { 
      console.log(e);
    }
    try{
      SERVER.close();
    } catch(e) { 
      console.log(e);
    }
    if (minio) { 
      kill(minio.pid,'SIGKILL'); 
      console.log('END, killing spawned proc') 
    }
    rimraf(MINIODATADIR, done);
  })

  it(' Should signup User, Create new Post, have Post posted', async function(){

    this.timeout(Infinity);

    minio =  runMinio();
    APP = await baseServer();
    await dbSync(true);
    const [freePort] = await ffport(3000);
    FREE_PORT = freePort;


    const jar = request.jar();

    await new Promise(R=>{
      SERVER = APP.listen(FREE_PORT,()=>{
        console.log(`Server listening on : ${FREE_PORT}`)
        R();
      });
    });


    const res1 = await Req.post('/api/user/signup',{
      email: 'robertapolana@gmail.com',
      password: 'password',
    },{ jar });

    const res2 = await Req.post('/auth',{
      username: 'robertapolana@gmail.com',
      password: 'password',
    },{ jar });

    const res3 = await Req.get('/auth',{ jar });

    assert.equal(res3.statusCode, 200);

    const AccountId = res3.body.user.Accounts[0].id

    assert(AccountId)

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

    let retry =0;
    while (!(await Photo.findAll()).length && retry++ <= 3){
      console.log(`try ${retry} Photo not in DB retrying in 1 sec....`);
      await Promise.delay(1000);
    }


    const photoFile = path.join(BUCKETPATH,objectName)

    const originalFileMd5 = md5File.sync(photoFile);
    const uploadFileMd5 = md5File.sync(spaceCat.path);

    assert.equal(originalFileMd5, uploadFileMd5);


    const res6 = await Req.post('/api/igaccount',{
      AccountId,
      username: 'username',
      password: 'password'
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

    await Job.initJobs();

    const jobs  = await Job.outstanding();

    assert(jobs.length,1);

    const doJob = await (await Job.popJob()).reloadWithAll();

    const fullJob = doJob.toJSON();

    assert.equal(fullJob.Post.id,post.id);
    assert.equal(fullJob.IGAccount.username,igaccount.username);
    assert.equal(fullJob.IGAccount.id,igaccount.id);
    assert.equal(fullJob.Post.Photo.objectName, objectName);


    //Req.post('/api/user/invite_')



  })

})
