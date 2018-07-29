const sinon = require('sinon');
const assert = require('assert');
const cmds = require('../../android/cmds');
const minio = require('../../server-lib/minio');

const { MClient } = minio;
const OBJECTS = require('../../models');

const {
  Photo, Account, IGAccount, Device, Post, PostJob, VerifyIGJob,
} = OBJECTS;

const Tasks = require('../../tasks');
const { readFileSync } = require('fs');
const syncDb = require('../../db/sync');
const DeviceAgent = require('../../android/deviceAgent');
const EventEmitter = require('../../lib/eventEmitter');

describe('Tasks', () => {
  let sandBox;
  const password = '!#@$%',
    username = 'heydude';

  describe('downloadIGAva', () => {
    beforeEach(async () => {
      sandBox = sinon.sandbox.create();
      await syncDb(true);
    });

    afterEach(() => sandBox.restore());

    it('should download igaccount avatar', async () => {
      const events = new EventEmitter();
      events.on('job:error', console.error);

      const IGAccount = { id: 1, password, username };

      const IGAVAFixture = readFileSync(`${__dirname}/../fixtures/kimkardashian-ig.html`).toString();

      sandBox
        .stub(MClient.prototype, 'getSignedPutObject')
        .returns('http://127.0.0.1/put_photo_here');
      const minioClient = new MClient();

      const reqAsync = {
        get: async () => IGAVAFixture,
      };

      const pipe = sinon.mock().returns({ on: (_, rs) => rs() });

      const reqPipe = {
        get: sinon.mock().returns({ pipe }),
        put: sinon.spy(),
      };

      const jobComplete = new Promise(rs => events.on('job:complete', rs));

      Tasks.downloadIGAva({
        jobId: 1,
        jobName: 'downloadIGAva',
        events,
        minioClient,
        reqAsync,
        reqPipe,
        IGAccount,
      });

      await jobComplete;

      const photo = await Photo.scope('avatar').findOne();

      assert(photo);

      assert.equal(reqPipe.put.getCall(0).args[0], 'http://127.0.0.1/put_photo_here');
      assert.equal(
        reqPipe.get.getCall(0).args[0],
        'https://instagram.fdad1-1.fna.fbcdn.net/vp/fb2f9813830c704783a165569b95a6ff/5BEB2087/t51.2885-19/s150x150/35414722_1833801803589327_7624906533519753216_n.jpg',
      );
    });
  });

  describe('verifyIG', () => {
    it('should emit IGAccount:good & job:complete on successful deviceAgent login', async () => {
      const events = new EventEmitter();

      const IGAccount = { id: 1, password, username };

      const agent = { exec: sinon.spy(async () => ({ body: { login: true } })) };

      const accountGood = new Promise(rs => events.on('IGAccount:good', rs));
      const jobComplete = new Promise(rs => events.on('job:complete', rs));

      const reqAsync = { get: async () => ({ statusCode: 200 }) };

      Tasks.verifyIG({
        events,
        jobId: 1,
        jobName: 'verifyIG',
        agent,
        IGAccount,
        reqAsync,
      });

      assert.deepEqual(await accountGood, { jobId: 1, jobName: 'verifyIG', id: 1 });

      assert.deepEqual(await jobComplete, { jobId: 1, jobName: 'verifyIG' });

      assert.deepEqual(agent.exec.getCall(0).args[0], {
        cmd: 'verify_ig_dance',
        args: {
          username,
          password,
        },
      });
    });
    it('should emit IGAccount:fail & job:complete on when http request to http://instagram/<username> returns 404', async () => {
      const events = new EventEmitter();

      const IGAccount = { id: 1, password, username };

      const accountFail = new Promise(rs => events.on('IGAccount:fail', rs));
      const jobComplete = new Promise(rs => events.on('job:complete', rs));

      const reqAsync = { get: async () => ({ statusCode: 404 }) };

      Tasks.verifyIG({
        events,
        jobId: 1,
        jobName: 'verifyIG',
        agent: {},
        IGAccount,
        reqAsync,
      });

      assert.deepEqual(await accountFail, { jobId: 1, jobName: 'verifyIG', id: 1 });

      assert.deepEqual(await jobComplete, { jobId: 1, jobName: 'verifyIG' });
    });
    it('should emit IGAccount:fail & job:complete on known failed state of deviceAgent login', async () => {
      const events = new EventEmitter();

      const IGAccount = { id: 1, password, username };

      const agent = {
        exec: sinon.spy(async () => ({ body: { login: false, type: 'creds_error' } })),
      };

      const accountFail = new Promise(rs => events.on('IGAccount:fail', rs));
      const jobComplete = new Promise(rs => events.on('job:complete', rs));

      const reqAsync = { get: async () => ({ statusCode: 200 }) };

      Tasks.verifyIG({
        events,
        jobId: 1,
        jobName: 'verifyIG',
        agent,
        IGAccount,
        reqAsync,
      });

      assert.deepEqual(await accountFail, { jobId: 1, jobName: 'verifyIG', id: 1 });

      assert.deepEqual(await jobComplete, { jobId: 1, jobName: 'verifyIG' });
    });
  });

  describe('sendEmail', () => {
    it('should emit job:complete upon email send', async () => {
      const events = new EventEmitter();

      const data = {
        to: 'a@a.com',
        from: 'b@b.com',
        msg: 'hi',
        subject: 'hi',
      };

      Tasks.sendEmail({
        events,
        jobId: 1,
        jobName: 'email',
        data,
      });

      const jobComplete = new Promise(rs => events.on('job:complete', rs));

      assert.deepEqual(await jobComplete, { jobId: 1, jobName: 'email' });
    });
  });

  describe('post', () => {
    it('should emit Post:published and job:complete on successful deviceAgent login and post', async () => {
      const events = new EventEmitter();

      const Post = { id: 1, Photo: { objectName: 'objectName' }, text: 'text' };

      const IGAccount = { id: 1, password, username };

      const minioClient = { pullPhoto: sinon.spy(async () => '/tmpfile') };

      const agent = { exec: sinon.spy(async () => ({ success: true, body: { login: true } })) };

      const jobComplete = new Promise(rs => events.on('job:complete', rs));

      const postPublished = new Promise(rs => events.on('Post:published', rs));

      Tasks.post({
        events,
        jobId: 1,
        jobName: 'post',
        agent,
        IGAccount,
        Post,
        minioClient,
      });

      assert.deepEqual(minioClient.pullPhoto.getCall(0).args[0], { name: 'objectName' });

      assert.deepEqual(await postPublished, { jobId: 1, jobName: 'post', id: Post.id });

      assert.deepEqual(await jobComplete, { jobId: 1, jobName: 'post' });

      assert.deepEqual(agent.exec.getCall(0).args[0], {
        cmd: 'full_dance',
        args: {
          username,
          password,
          desc: 'text',
          localfile: '/tmpfile',
        },
      });
    });

    it('should emit Post:failed and job:error on unsuccessful posting');
    it('should emit job:error, Post:failed and IGAccount:fail on unsuccessful deviceAgent login and post attempt', async () => {
      const events = new EventEmitter();

      const Post = { id: 1, Photo: { objectName: 'objectName', text: 'text' } };

      const IGAccount = { id: 1, password: '!#@$%', username: 'heydude' };

      const minioClient = { pullPhoto: async () => 'OBJECTPATH' };

      const agent = {
        exec: async () => ({
          success: false,
          body: {
            login: false,
            type: 'creds_error',
          },
        }),
      };

      const accountFail = new Promise(rs => events.on('IGAccount:fail', rs));
      const jobFail = new Promise(rs => events.on('job:error', rs));

      Tasks.post({
        events,
        jobId: 1,
        jobName: 'post',
        agent,
        IGAccount,
        Post,
        minioClient,
      });

      const jf = await jobFail;

      assert.deepEqual(await accountFail, { jobId: 1, jobName: 'post', id: 1 });
      assert(/credentials/i.test(jf.error));
      assert.equal(jf.jobId, 1);
      assert.equal(jf.jobName, 'post');
    });

    it('should retry tasks x times before complete failure');

    it('should emit job:error on unknown deviceAgent login error and post attempt', async () => {
      const events = new EventEmitter();

      const Post = { id: 1, Photo: { objectName: 'objectName', text: 'text' } };

      const IGAccount = { id: 1, password: '!#@$%', username: 'heydude' };

      const minioClient = { pullPhoto: async () => 'OBJECTPATH' };

      const agent = {
        exec: async () => ({
          body: {
            success: false,
            login: false,
            type: '?????',
          },
        }),
      };

      const jobFail = new Promise(rs => events.on('job:error', rs));

      Tasks.post({
        events,
        jobId: 1,
        jobName: 'post',
        agent,
        IGAccount,
        Post,
        minioClient,
      });

      const jf = await jobFail;

      assert(/unknown/i.test(jf.error));
      assert.equal(jf.jobId, 1);
      assert.equal(jf.jobName, 'post');
    });
  });
});
