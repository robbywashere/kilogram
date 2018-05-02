const { runJobs, run, main, syncDevices } = require('../engine');
const { createAccountUserPostJob }  = require('./helpers')
const sinon = require('sinon');
const assert = require('assert');
const cmds = require('../android/cmds');
const { Device, Job, Post } = require('../objects');
const syncDb = require('../db/sync');
const runner = require('../python/runner');
const Promise = require('bluebird');

//TODO: Possible memory link, interferes with other tests, must be ran seperately
describe('engine' , function(){


  let agentStub;


  let jobRunStub;

  var sandbox = sinon.sandbox.create();

  beforeEach(async ()=>{


    await syncDb(true)
    const adbDevicesStub = sandbox.stub(cmds, 'adbDevices').resolves(['adbId1','adbId2']);

    const deviceIdSpy = sinon.spy();

    const agentStubInstance = sinon.spy(function() {
      return sinon.createStubInstance(runner.Agent);
    });

    agentStub = sandbox.stub(runner,'Agent').returns(agentStubInstance())

    jobRunStub = sandbox.stub(runner, 'JobRun').resolves((async ()=>{
      await Promise.delay(200);
      return { success: true }
    })());


  })

  afterEach(()=>{
   sandbox.restore()
  });



  it.only('should match queued jobs to free devices', async function(){

    const d1 = await Device.create({
      adbId: 'adbId1',
      idle: true,
      online: true,
      enabled: true,
    })

    const d2 = await Device.create({
      adbId: 'adbId2',
      idle: false,
      online: true,
      enabled: true,
    })

    const p = (await createAccountUserPostJob()).post;


    await runJobs()();

    const { post, agent, job, igAccount, photo } = jobRunStub.getCall(0).args[0];

    assert.equal(post.id,p.id);
    assert.equal(photo.id,p.PhotoId);
    assert.equal(job.id, p.Job.id)
    assert(igAccount.id)
    assert(agentStub.calledWith({ deviceId: 'adbId1' }))

    await d1.reload();

    assert(d1.idle)

  })



  it('should run a function every x amount of milli seconds' , async function(){

    this.timeout(5000);

    let called = 0;
    const fn = ()=>{ called++; return Promise.resolve()};
    const timer = run(fn, 500)
    await Promise.delay(1000)
    timer.close();
    assert(called, 2)
  });



  it ('should sync plugged in devices to db', async function(){

    const d1 = await Device.create({
      adbId: 'adbId1',
      idle: true,
      online: false,
    })

    const d2 = await Device.create({
      adbId: 'adbId2',
      idle: false,
      online: false,
    })

    const d3 = await Device.create({
      adbId: 'adbId3',
      idle: false,
      online: true,
    })

    await syncDevices();

    await d1.reload();
    await d2.reload();
    await d3.reload();

    assert(d1.get('online'));
    assert(d1.get('idle'));

    assert(d2.get('online'));
    assert(d2.get('idle'));

    assert(!d3.get('online'));


  })




})
