const {
  runJobs, run, main, syncDevices,
} = require('../../engine');
const { createAccountUserPostJob } = require('../helpers');
const sinon = require('sinon');
const assert = require('assert');
const cmds = require('../../android/cmds');
const { Device, Post, PostJob } = require('../../objects');
const syncDb = require('../../db/sync');
const runner = require('../../android/runner');
const DeviceAgent = require('../../android/deviceAgent');
const Promise = require('bluebird');

// TODO: Possible memory link, interferes with other tests, must be ran seperately
describe('engine', () => {
  let agentStub;

  let jobRunStub;

  const sandbox = sinon.sandbox.create();

  beforeEach(async () => {
    await syncDb(true);
    const adbDevicesStub = sandbox.stub(cmds, 'adbDevices').resolves(['adbId1', 'adbId2']);

    const deviceIdSpy = sinon.spy();

    const agentStubInstance = sinon.spy(() => sinon.createStubInstance(DeviceAgent.Agent));

    agentStub = sandbox.stub(DeviceAgent, 'Agent').returns(agentStubInstance());

    jobRunStub = sandbox.stub(runner, 'PostJobRun').resolves((async () => {
      await Promise.delay(200);
      return { success: true };
    })());
  });

  afterEach(() => {
    sandbox.restore();
  });


  it('should match queued PostJobs to free devices', async () => {
    const d1 = await Device.create({
      adbId: 'adbId1',
      idle: true,
      online: true,
      enabled: true,
    });

    const d2 = await Device.create({
      adbId: 'adbId2',
      idle: false,
      online: true,
      enabled: true,
    });

    const p = (await createAccountUserPostJob()).post;


    const jobRunner = sinon.stub().resolves((async () => {
      await Promise.delay(200);
      return { success: true };
    })());

    await runJobs({ nodeName: 'HOME1', jobRunner, JobModel: PostJob })();

    const { agent, job } = jobRunner.getCall(0).args[0];

    assert(agent.constructor instanceof sinon.constructor);

    assert.equal(job.id, p.PostJob.id);

    assert(agentStub.calledWith({ deviceId: 'adbId1' }));

    await d1.reload();

    assert(d1.idle);
  });


  it('should run a function every x amount of milli seconds', async function () {
    this.timeout(5000);

    let called = 0;
    const fn = () => { called++; return Promise.resolve(); };
    const timer = run(fn, 500);
    await Promise.delay(1000);
    timer.close();
    assert(called, 2);
  });


  it('should sync plugged in devices to db', async () => {
    const d1 = await Device.create({
      adbId: 'adbId1',
      idle: true,
      online: false,
    });

    const d2 = await Device.create({
      adbId: 'adbId2',
      idle: false,
      online: false,
    });

    const d3 = await Device.create({
      adbId: 'adbId3',
      idle: false,
      online: true,
    });

    await syncDevices();

    await d1.reload();
    await d2.reload();
    await d3.reload();

    assert(d1.get('online'));
    assert(d1.get('idle'));

    assert(d2.get('online'));
    assert(d2.get('idle'));

    assert(!d3.get('online'));
  });
});
