
process.env.NODE_ENV = 'test'; // TODO ?
const { PostJobRun, pullRemoteObject } = require('../python/runner');
const { Agent } = require('../python/deviceAgent');

const PythonShell = require('python-shell');
const { PythonBridge } = require('../python/bridge');
const sinon = require('sinon');
const assert = require('assert');
const sync = require('../db/sync');
const { Post, Device, User, Photo } = require('../objects');
const minio = require('../server-lib/minio');
const { MClient } = minio; 
const { createAccountUserPostJob } = require('./helpers');


describe.only('jobs/', function(){
  let minioStub;

  beforeEach(()=>sync(true))


  describe('function PostJobRun', function(){



    // TODO: PostJobRun job argument is kept normalized intentionally, keeping the interface
    // generic and leaving it up to the function 'PostJobRun' to be responsible for fetching its own data dependents
    // Abondanodnninedning
    it.skip(`should take argument, 'job' then agent.exec with proper data arguments`, async function(){


      const agent = { exec: sinon.spy(()=>{ throw new Error('ERROR!') }) };

      const { account, igAccount, user, post, job } = await createAccountUserPostJob();

      await post.reload({ include: [ Photo ] });

      const minioClient = {
        pullPhoto: sinon.mock().returns(Promise.resolve('/tmpfile'))
      }

      job.update = sinon.spy();

      await PostJobRun({ job, agent, minioClient }, false)

      assert.deepEqual(minioClient.pullPhoto.getCall(0).args[0],{ name: post.Photo.objectName })

      assert(
        agent.exec.calledWith({ 
          cmd: 'full_dance', 
          args: {
            username: igAccount.username,
            password: igAccount.password,
            desc: post.text,
            localfile: '/tmpfile' 
          } 
        }))


      assert(
        jobUpdateSpy.calledWith({
          success:false,
        })
      );


    })


    //const { account, igAccount, user, post, job } = await createAccountUserPostJob()
    //????TODO: PostJobRun no longer handles its errors, the error is to be handled by the caller, therefore this should be tested - runJobs()
    it.skip(`should run a job via sending a 'full_dance' cmd sent to python bridge and properly respond to errors`, async function(){



      const execSpy = sinon.spy(()=>{ throw new Error('ERROR!') });
      const jobUpdateSpy = sinon.spy();

      const minioClient = {
        pullPhoto: sinon.mock().returns(Promise.resolve('/tmpfile'))
      }

      const igAccount = {
        username: 'username',
        password: 'password' 
      }
      const post = {
        text: "#description"
      }
      const agent = {
        exec: execSpy
      }

      const job = {
        update: jobUpdateSpy
      }
      const photo = {
        objectName: 'objectName'
      }



      await PostJobRun({ job, agent, minioClient }, false)

      assert.deepEqual(minioClient.pullPhoto.getCall(0).args[0],{ name: 'objectName' })

      assert(
        execSpy.calledWith({ 
          cmd: 'full_dance', 
          args: {
            username: 'username',
            password: 'password',
            desc: '#description',
            localfile: '/tmpfile' 
          } 
        }))


      assert(
        jobUpdateSpy.calledWith({
          success:false,
        })
      );


    })

    it(`should run a job downloading photo then sending a 'full_dance' cmd to python bridge updating the job with the body`, async function(){



      const minioClient = {
        pullPhoto: sinon.mock().returns(Promise.resolve('/tmpfile'))
      }

      const IGAccount = {
        username: 'username',
        password: 'password' 
      }
      const Post = {
        text: "#description",
        Photo: { objectName: 'objectName' }
      }
      const agent = {
        exec: sinon.spy(()=>({ success: true }))
      }
      const job = {
        update: sinon.spy()
      }
      const photo = {
        objectName: 'objectName'
      }


      await PostJobRun({ job, agent, Post, IGAccount, minioClient })

      assert.deepEqual(minioClient.pullPhoto.getCall(0).args[0],{ name: 'objectName' })

      assert.deepEqual(
        agent.exec.getCall(0).args[0],
        { 
          cmd: 'full_dance', 
          args: {
            username: 'username',
            password: 'password',
            desc: '#description',
            localfile: '/tmpfile' 
          } 
        })
      assert.deepEqual(
        job.update.getCall(0).args[0],
        { success: true }
      )

    })

  });

  describe('class Agent', function(){


    let sandbox = sinon.sandbox.create();


    afterEach(()=>{
      sandbox.restore()
    });

    it('should send an echo cmd to the python bridge', function(done){

      this.timeout(5000);

      const agent = new Agent({ deviceId: 'adbId'});

      const bridge = agent.connect();

      agent.exec({cmd: 'echo', args: { arg1: true }}).then( result => {
        try {
          assert.deepEqual(result, { 
            args: {
              arg1: true
            },
            deviceId: "adbId",
            method: "echo"
          })
          done();
        } catch(e) {
          return done(e);
        }

      })
    })

    it ('should send a testcmd to the python bridge', function(done){

      const agent = new Agent({ deviceId: 'adbId'});

      const bridge = agent.connect();

      sandbox.stub(PythonShell.prototype,'send').callsFake((data)=>{
        try {
          assert.deepEqual(data,{ deviceId: 'adbId', args: {}, method: '__testcmd__' })
        } catch(e) {
          done(e);
          throw e;
        }
      });

      agent.exec({ cmd: '__testcmd__', args: {} }).then( result => {
        try {
          //TODO: change this use status codes 400 for bad request for example
          assert.deepEqual(result, { error: "no input", code: 400, success: false })
          done();
        } catch(e) {
          return done(e);
        }
      })
    })


  })
})
