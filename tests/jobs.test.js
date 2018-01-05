
process.env.NODE_ENV = 'test'; // TODO ?
const { JobRun, Agent } = require('../python/runner');

const PythonShell = require('python-shell');
const sinon = require('sinon');
const assert = require('assert');
const sync = require('../db/sync');
const { Post, Job, Device, User, Photo } = require('../objects');

beforeEach(async ()=> {
  return await sync(true);
});

describe('jobs/', function(){

  describe('function JobRun', function(){
    it(`should run a job via sending a 'full_dance' cmd sent to python bridge and properly respond to errors`, async function(){


      const execSpy = sinon.spy(()=>{ throw new Error('ERROR!') });
      const jobUpdateSpy = sinon.spy();
      const photoGetSpy = sinon.stub().returns('src');

      const user = {
        igUsername: 'username',
        igPassword: 'password' 
      }
      const post = {
        desc: "#description"
      }
      const agent = {
        exec: execSpy
      }
      const job = {
        update: jobUpdateSpy
      }
      const photo = {
        get: photoGetSpy
      }



      await JobRun({ job, agent, post, photo, user }, false)

      assert(
        execSpy.calledWith({ 
          cmd: 'full_dance', 
          args: {
            username: 'username',
            password: 'password',
            desc: '#description',
            objectname: 'src' 
          } 
        }))


      assert(
        jobUpdateSpy.calledWith({
          inprog:false,
          finish:false,
          outcome:{
            success:false,
            error: "Error: ERROR!"
          }
        })
      );


    })

    it(`should run a job via sending a 'full_dance' cmd sent to python bridge updating the job with the outcome`, async function(){


      const execSpy = sinon.spy(()=>({ success: true }));
      const jobUpdateSpy = sinon.spy();
      const photoGetSpy = sinon.stub().returns('src');

      const user = {
        igUsername: 'username',
        igPassword: 'password' 
      }
      const post = {
        desc: "#description"
      }
      const agent = {
        exec: execSpy
      }
      const job = {
        update: jobUpdateSpy
      }
      const photo = {
        get: photoGetSpy
      }



      await JobRun({ job, agent, post, photo, user })

      assert(
        execSpy.calledWith({ 
          cmd: 'full_dance', 
          args: {
            username: 'username',
            password: 'password',
            desc: '#description',
            objectname: 'src' 
          } 
        }))

      assert(
        jobUpdateSpy.calledWith({
          inprog: false,
          finish: true,
          outcome: { success: true }
        })
      )

    })

  });

  describe('class Agent', function(){

    it ('should send an echo cmd to the python bridge', function(done){

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

      sinon.stub(bridge.shell,'send').callsFake((data)=>{

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

  /*
  describe('class JobRunner' ,function() { 
    describe('.exec', function(){

      it ('should gracefully handle exceptions in the python execution returning the Job to initial state', function(done){
        (async () => {

          const device = await Device.create({
            idle: true,
            online: true,
            enabled: true,
            adbId: 'abdid' 
          })
          const job = await Job.create({
            cmd: 'raise_except',
            args: { },
          })
          const agent = new Agent();
          const jr = new JobRunner({ job, device, agent })

          const bridge = agent.connect('adbId');

          const result = await jr.exec({ throws: true });

          try {
            assert.deepEqual(result, { 
              success: false,
              error: "<type 'exceptions.Exception'>"
            })
          } catch(e) {
            return done(e);
          }

          j = await Job.findById(job.id);
          assert.equal(j.inprog, false);

          done();

        })().catch( (e) => done(e) )
})


it('should set the job to inprog: true', function(done){
  (async () => {


    const device = await Device.create({
      idle: true,
      online: true,
      adbId: 'abdid' 
    })
    const job = await Job.create({
      cmd: 'cmd',
      args: { },
    })


    const newJob = await Job.popJob();

    const j = await Job.findById(job.id);

    assert.equal(j.id, newJob.id)

    assert.equal(j.inprog, true)

    assert.equal(newJob.inprog,true)

    const agent = new Agent();

    const jr = new JobRunner({ job, device, agent })

    const bridge = agent.connect('adbId');



    done();

  })().catch( (e) => done(e) )
})

})
}) */
})
