const {
  runJobs, run, main, syncDevices,
} = require('../../engine');
const {
  createAccountUserPostJob,
  createUserAccountIGAccountPhotoPost,
} = require('../helpers');
const sinon = require('sinon');
const assert = require('assert');
const cmds = require('../../android/cmds');
const {
  Account, IGAccount, Device, Post, PostJob, VerifyIGJob
} = require('../../objects');
const syncDb = require('../../db/sync');
const Runner = require('../../android/runner');
const DeviceAgent = require('../../android/deviceAgent');

const Promise = require('bluebird');

// TODO: ADD useFakeTimers

// TODO: Possible memory link, interferes with other tests, must be ran seperately
//
const DeviceFactory = n => Device.create({
  adbId: `adbId${n}`,
  idle: true,
  online: true,
  enabled: true,
  nodeName: 'HOME1',
});

describe('engine tests', () => {
  describe('main()', () => {
    let Device1,
      Device2,
      Device3,
      timers = [],
      photo,
      post,
      user,
      account,
      igAccount,
      sandbox,
      PostJobRun_STUB,
      VerifyIGJobRun_STUB;


    beforeEach(async () => {
      await syncDb(true);
      ({
        user, account, photo, post, igAccount,
      } = await createUserAccountIGAccountPhotoPost());
      await igAccount.good();
      
      Device1 = await DeviceFactory(1);
      Device2 = await DeviceFactory(2);
      Device3 = await DeviceFactory(3);
      sandbox = sinon.sandbox.create();
      sandbox.stub(cmds, 'adbDevices').resolves([Device1, Device2, Device3].map(d => d.adbId));
      PostJobRun_STUB = sandbox.stub(Runner, 'PostJobRun').resolves(async () => {});
      VerifyIGJobRun_STUB = sandbox.stub(Runner, 'VerifyIGJobRun').resolves(async () => {});
      timers = main({ nodeName: 'HOME1', interval: 500 });
    });

    afterEach(() => {
      timers.forEach(clearInterval);
      timers = [];
      try { sandbox.restore(); } catch (e) { /* */ }
    });
    // await createAccountUserPostJob()

    it('shoud run and return an array of timers<setInterval>', async () => {
      assert(timers.length > 0);
    });


    it('\t should put PostJob in progress with device', async () => {


      while (!(await PostJob.inProgress()).length) {
        /* Wait for job  */
      }

      const pj = await PostJob.findOne();

      assert(pj);

      assert(pj.isInProgress());

      // while (!(await Device.inProgress()).length) {/* Wait for device */}

      let agent;
      while(true) {
        try {
          ({ agent } = PostJobRun_STUB.getCall(0).args[0]);
          break;
        } catch(e) {}
        await new Promise(rs=>process.nextTick(rs))
      }
      assert(agent.deviceId);

    });


    it('\t Should put VerifyIGJob in progress with device', async () => {
      while (!(await VerifyIGJob.inProgress()).length) {
        /* */
      }
      const vij = await VerifyIGJob.findOne();
      assert(vij);
      assert(vij.isInProgress());

      let agent;
      while(true) {
        try {
          ({ agent } = VerifyIGJobRun_STUB.getCall(0).args[0]);
          break;
        } catch(e) {}
        await new Promise(rs=>process.nextTick(rs))
      }
      assert(agent.deviceId);

    })
  });


  describe('engine unit', () => {
    let agentStub;
    let jobRunStub;
    const sandbox = sinon.sandbox.create();

    beforeEach(async () => {
      await syncDb(true);
      const adbDevicesStub = sandbox.stub(cmds, 'adbDevices').resolves(['adbId1', 'adbId2']);
      const deviceIdSpy = sinon.spy();
      const agentStubInstance = sinon.spy(() => sinon.createStubInstance(DeviceAgent.Agent));

      agentStub = sandbox.stub(DeviceAgent, 'Agent').returns(agentStubInstance());

      jobRunStub = sandbox.stub(Runner, 'PostJobRun').resolves((async () => {
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
});
