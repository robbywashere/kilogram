
process.env.NODE_ENV = 'test'; // TODO ?
const { JobRunner, Agent } = require('../python/runner');

const PythonShell = require('python-shell');
const sinon = require('sinon');
const assert = require('assert');
const sync = require('../db/sync');
const { Job, Device } = require('../objects');

beforeEach(async ()=> {
  return await sync(true);
});

describe('jobs/', function(){
  describe('class JobRunner' ,function() { 
    describe('.exec', function(){

      it ('should send a testcmd to the python bridge', function(done){
        (async () => {
          const device = await Device.create({
            idle: true,
            online: true,
            enabled: true,
            adbId: 'abdid' 
          })
          const job = await Job.create({
            cmd: '__testcmd__',
            args: { }
          })
          const agent = new Agent();
          
          const jr = new JobRunner({ job, device, agent })

          const bridge = agent.connect('adbId');

          sinon.stub(bridge.shell,'send').callsFake((data)=>{
            try {
              assert.deepEqual(data,{ deviceId: 'adbId', args: {}, method: '__testcmd__' })
            } catch(e) {
              done(e);
              throw e;
            }
          });


          const result = await jr.exec({ throws: true });

          try {
            assert.deepEqual(result, { error: "noinput", success: false })
          } catch(e) {
            return done(e);
          }
          done();
        })().catch( (e) => done(e) )
      })

      // TODO: MOVE
      it ('should be able to fetch outstanding jobs and free devices', async function(){


          const d = await Device.create({
            idle: true,
            online: true,
            enabled: true,
            adbId: 'abdid' 
          })
          const j = await Job.create({
            cmd: 'echo',
            args: { arg1: true },
          })
          const agent = new Agent();

          const jobs = await Job.outstanding();

          const devices  = await Device.free();

          assert.equal(jobs[0].cmd, 'echo');
          assert.equal(devices[0].adbId, 'abdid');

        //const jr = new JobRunner({ job, device, agent })

      
      
      })

      it ('should send an echo command to the python bridge', function(done){
        (async () => {
          const device = await Device.create({
            idle: true,
            online: true,
            enabled: true,
            adbId: 'abdid' 
          })
          const job = await Job.create({
            cmd: 'echo',
            args: { arg1: true },
          })
          const agent = new Agent();
          const jr = new JobRunner({ job, device, agent })

          const bridge = agent.connect('adbId');
          const result = await jr.exec({ throws: true });
          try {
            assert.deepEqual(result, { 
              args: {
                arg1: true
              },
              deviceId: "adbId",
              method: "echo"
            })
          } catch(e) {
            return done(e);
          }
          done();

        })().catch( (e) => done(e) )
      })

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


          const newJob = await Job.getJob();

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
  })
})
