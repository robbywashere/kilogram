
process.env.NODE_ENV = 'test'; // TODO ?
const { JobRun, Agent, pullRemoteObject } = require('../python/runner');

const PythonShell = require('python-shell');
const { PythonBridge } = require('../python/bridge');
const sinon = require('sinon');
const assert = require('assert');
const sync = require('../db/sync');
const { Post, Job, Device, User, Photo } = require('../objects');
const minio = require('../server-lib/minio');
const { MClient } = minio; 


describe('jobs/', function(){
  let minioStub;

  //TODO: remove this as passing minioClient to JobRun is now an option
  /*beforeEach(async ()=> {
    await sync(true);
    const mClientStubInstance = function() {
      const mcstub = sinon.createStubInstance(MClient);
      mcstub.pullPhoto.resolves('/tmpfile');
      return mcstub;
    };
    minioStub = sinon.stub(minio,'MClient').returns(mClientStubInstance())
  });
  afterEach(()=>minioStub.restore())
  */

  beforeEach(()=>sync(true))

  describe('function JobRun', function(){
    //TODO: JobRun no longer handles its errors, the error is to be handled by the caller, therefore this should be tested - runJobs()
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



      await JobRun({ job, agent, post, photo, igAccount, minioClient }, false)

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

    it(`should run a job downloading photo then sending a 'full_dance' cmd to python bridge updating the job with the outcome`, async function(){


      const execSpy = sinon.spy(()=>({ success: true }));
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



      await JobRun({ job, agent, post, photo, igAccount, minioClient })

      assert.deepEqual(minioClient.pullPhoto.getCall(0).args[0],{ name: 'objectName' })

      assert.deepEqual(
        execSpy.getCall(0).args[0],
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
        jobUpdateSpy.getCall(0).args[0],
        { success: true }
      )

    })

  });

  describe('class Agent', function(){

    it('should send an echo cmd to the python bridge', function(done){

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

      sinon.stub(PythonShell.prototype,'send').callsFake((data)=>{
        try {
          assert.deepEqual(data,{ deviceId: 'adbId', args: {}, method: '__testcmd__' })
        } catch(e) {
          done(e);
          throw e;
        }
      });

      agent.exec({ cmd: '__testcmd__', args: {} }).then( result => {
        try {
          assert.deepEqual(result, { error: "noinput", success: false })
          done();
        } catch(e) {
          return done(e);
        }
      })
    })


  })
})
