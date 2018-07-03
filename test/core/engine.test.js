const {
  runDeviceJob, run, main, syncDevices,
} = require('../../engine');
const {
  createAccountUserPostJob,
  createUserAccountIGAccountPhotoPost,
  deviceFactory
} = require('../helpers');
const sinon = require('sinon');
const assert = require('assert');
const cmds = require('../../android/cmds');
const minio = require('../../server-lib/minio');
const {
  Account, IGAccount, Device, Post, PostJob, VerifyIGJob
} = require('../../objects');
const syncDb = require('../../db/sync');
const Runner = require('../../services');
const DeviceAgent = require('../../android/deviceAgent');

const Promise = require('bluebird');

// TODO: ADD useFakeTimers

// TODO: Possible memory link, interferes with other tests, must be ran seperately
//

describe.skip('engine tests', () => {
  describe('main() loop', () => {
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
      start,
      PostJobRun_STUB,
      VerifyIGJobRun_STUB;


    beforeEach(async () => {
      await syncDb(true);
      ({
        user, account, photo, post, igAccount,
      } = await createUserAccountIGAccountPhotoPost());
      await igAccount.good();

      Device1 = await deviceFactory(1,'HOME1');
      Device2 = await deviceFactory(2,'HOME1');
      Device3 = await deviceFactory(3,'HOME1');
      sandbox = sinon.sandbox.create();
      sandbox.stub(cmds, 'adbDevices').resolves([Device1, Device2, Device3].map(d => d.adbId));
      PostJobRun_STUB = sandbox.stub(Runner, 'PostJobRun').resolves(async () => {});
      VerifyIGJobRun_STUB = sandbox.stub(Runner, 'VerifyIGJobRun').resolves(async () => {});

      //const mclientStubInstance = sinon.spy(() => sinon.createStubInstance(minio.MClient));
      //agentStub = sandbox.stub(DeviceAgent, 'Agent').returns(mclientStubInstance());

      start = ()=> timers = main({ nodeName: 'HOME1', interval: 500 });
    });

    afterEach(() => {
      timers.forEach(clearInterval);
      timers = [];
      try { sandbox.restore(); } catch (e) { /* */ }
    });
    // await createAccountUserPostJob()

    it('shoud run and return an array of timers<setInterval>', async () => {
      start();
      assert(timers.length > 0);
    });


    it('should runDeviceJob \'PostJobRun\' and \'VerifyIGJobRun\'', async ()=> {
      PostJobRun_STUB.restore();
      VerifyIGJobRun_STUB.restore();
      sandbox.spy(minio.MClient.prototype, 'constructor');
      sandbox.stub(minio.MClient.prototype, 'pullPhoto').resolves('/tmp/somefile.jpg');
      sandbox.stub(DeviceAgent.Agent.prototype, 'exec').resolves({ success: true, body: { login: true } });
      start();

      //logger.debug('Waiting for post to complete ...')
      while (!(await PostJob.completed()).length) {
        await Promise.delay(250);
      }

      const igvs = await IGAccount.verified();
      assert.equal(igvs.length,1);

      assert.equal(igvs[0].status, 'GOOD');

      const vijcs = await VerifyIGJob.completed();
      assert.equal(vijcs.length,1);
      assert.equal(vijcs[0].status,'SUCCESS');

      const pjcs = await PostJob.completed();
      assert.equal(pjcs.length,1);
      assert.equal(pjcs[0].status, 'SUCCESS');

    });

    it('\t should put PostJob in progress with device', async () => {

      start();

      while (!(await PostJob.inProgress()).length) {
        /* Wait for job  */
      }

      const pj = await PostJob.findOne();

      assert(pj);

      assert(pj.isInProgress());

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
      start();
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

      await runDeviceJob({ nodeName: 'HOME1', jobRunner, JobModel: PostJob })();

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
