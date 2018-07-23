const Spinner = require('../../engine/spinner');
const {
  main,
  EngineEvents,
  VerifyIGSprocket,
  PostSprocket,
  SendEmailSprocket,
  DownloadAvaSprocket,
  SyncDeviceSprocket,
  EventRegister,
} = require('../../engine');
const {
  createAccountUserPostJob,
  createUserAccountIGAccountPhotoPost,
  deviceFactory,
} = require('../helpers');
const sinon = require('sinon');
const assert = require('assert');
const cmds = require('../../android/cmds');
const minio = require('../../server-lib/minio');
const OBJECTS = require('../../objects');
const {
  Account, IGAccount, Device, Post, PostJob, VerifyIGJob,
} = OBJECTS;
const syncDb = require('../../db/sync');
const DeviceAgent = require('../../android/deviceAgent');
// const { EventEmitter } = require('events');

const EventEmitter = require('../../lib/eventEmitter');

const Promise = require('bluebird');


describe('engine', () => {
  describe('Sprockets', () => {
    let Device1,
      Device2,
      Device3,
      events,
      SprocketArgs,
      Sprocket,
      sandbox;
    beforeEach(async () => {
      await syncDb(true);

      await Promise.all([
        deviceFactory(1, 'HOME1').then(d=>Device1 = d),
        deviceFactory(2, 'HOME1').then(d=>Device2 = d),
        deviceFactory(3, 'HOME1').then(d=>Device3 = d)
      ]);

      sandbox = sinon.sandbox.create();
      sandbox.stub(cmds, 'adbDevices').resolves([Device1, Device2, Device3].map(d => d.adbId));

      events = EngineEvents();
      events.on('eventError',({ error })=>console.error(error));
      events.on('job:error',({ error, body, jobId, jobName })=>console.error(error));

      SprocketArgs = { 
        nodeName: 'HOME1', 
        events,
        minioClient: {}, 
        concurrent: 1, 
        debounce: 500 
      }


    });


    afterEach(() => {
      try { sandbox.restore(); } catch (e) { /* */ }
      events.clearListeners();
      try {  Sprocket.stop() } catch(e) {};
    });

    describe('VerifyIGSprocket', () => {

      afterEach(()=>{
      });

      it('should run task VerifyIG and verify IGAccount', async () => {

        Sprocket = VerifyIGSprocket(SprocketArgs);
        Sprocket.on('reject',console.error);

        sandbox.stub(DeviceAgent.Agent.prototype, 'exec').resolves({ success: true, body: { login: true } });

        const { igAccount } = await createAccountUserPostJob();

        assert.equal(igAccount.status,'UNVERIFIED');

        assert(await VerifyIGJob.findOne());

        while (!(await IGAccount.verified()).length) {
          await Promise.delay(250);
        }

        const iga = await IGAccount.findById(igAccount.id);

        assert.equal(iga.status,'GOOD');

      }).timeout(2000);

    });
    describe('PostSprocket', () => {
      it('should run task PostSprocket, setting Post to Published when complete', async () => {

        sandbox.stub(DeviceAgent.Agent.prototype, 'exec').resolves({ success: true, body: { login: true } });
        const minioClient = { pullPhoto: async ()=> 'localfilename' }
        Sprocket = PostSprocket({ ...SprocketArgs, minioClient });
        Sprocket.on('reject',console.error);

        const { post, job } = await createAccountUserPostJob();


        assert.equal(post.status,'PUBLISH');

        while (!(await Post.published()).length) {
          await Promise.delay(1000);
        }

        const p = (await Post.published())[0];

        assert.equal(p.status,'PUBLISHED');

      });
    });
    describe('SendEmailSprocket', () => {
      it('should run task SendEmailSprocket', () => {

      });
    });
    describe('DownloadAvaSprocket', () => {
      it('should run task DownloadAvaSprocket', () => {

      });
    });
    describe('SyncDeviceSprocket', () => {
      it('should run task SyncDeviceSprocket', () => {

      });
    });
  });


  describe('EventRegister', () => {
    it('should register an event with a callback', async () => {
      const ee = new EventEmitter();

      const eventr = EventRegister(ee);

      const callMeProm = new Promise(rs => eventr('call:me', async ({ payload }) => {
        rs(payload);
      }));

      ee.emit('call:me', { payload: true });

      const pl = await callMeProm;

      assert.equal(pl, true);
    });

    it('registered event should emit "eventError" when error in callback', async () => {
      const flip = false;

      const ee = new EventEmitter();

      const eventr = EventRegister(ee);

      eventr('call:me', async ({ payload }) => {
        throw new Error('I HAZ ERROR');
      });

      process.nextTick(() => ee.emit('call:me', { payload: true }));
      const error = await new Promise(rs => ee.on('eventError', ({ name, error }) => rs(error)));
      assert.equal(error, 'Error: I HAZ ERROR');
    });
  });


  describe('Spinner', () => {
    it('Should continue call of given function with n concurrency x debounce time', async () => {
      let count = 0;
      const fn = async () => count++;

      const spin = new Spinner({ fn, concurrent: 3, debounce: 1000 });

      spin.start(); // .on('resolve',console.log);

      await new Promise(rs => process.nextTick(rs));

      spin.stop();

      assert.equal(count, 3);
    });

    it('Should emit a "resolve" event on every fn resolve', async () => {
      let resolveCount = 0;
      let count = 0;
      const myfn = async () => count++;

      const spin = new Spinner({ fn: myfn, concurrent: 3, debounce: 1000 });

      spin.start().on('resolve', () => resolveCount++);

      await new Promise(rs => process.nextTick(rs));

      spin.stop();

      assert.equal(count, 3);
      assert.equal(resolveCount, 3);
    });


    it('Should emit a "reject" event on every fn error', async () => {
      let rejectCount = 0;
      const count = 0;
      const myfn = async () => {
        throw new Error('I HAZ ERROR!');
      };

      const spin = new Spinner({ fn: myfn, concurrent: 3, debounce: 1000 });

      spin.start().on('reject', () => rejectCount++);

      await new Promise(rs => process.nextTick(rs));

      spin.stop();

      assert.equal(rejectCount, 3);
    });

    it('Should emit a "close" when Spinner instance is .stop()\'ed ', async () => {
      const myfn = async () => {};

      let closeEvent = false;

      const spin = new Spinner({ fn: myfn, concurrent: 3, debounce: 1000 });

      // nextTick'ing because we want to maybe use async events? idk
      spin.start().on('close', () => process.nextTick(() => closeEvent = true));

      const closePromise = new Promise(rs => spin.on('close', rs));

      spin.stop();

      await closePromise;

      assert(closeEvent);
    });
  });
});
