const { PostJobRun, VerifyIGJobRun, DownloadIGAvaJobRun, pullRemoteObject } = require('../../services');
const { Agent } = require('../../android/deviceAgent');
const { JobMethods } = require('../../objects/_JobsBase');
const IGAccount = require('../../objects/IGAccount');
const nock = require('nock');
const PythonShell = require('python-shell');
const { PythonBridge } = require('../../android/bridge');
const sinon = require('sinon');
const assert = require('assert');
const sync = require('../../db/sync');
const minioObj = require('../../server-lib/minio/minioObject');

const {
  Post, Device, User, Photo,
} = require('../../objects');

const minio = require('../../server-lib/minio');

const { createReadStream, readFileSync } = require('fs');

const { MClient } = minio;

const { createAccountUserPostJob, createUserAccountIGAccount } = require('../helpers');



describe('all jobs', () => {

  beforeEach(() => sync(true));


  let sandBox;
  let igAccount; 

  describe('function VerifyIGJobRun', () => {
    let agent;
    let job;

    beforeEach(async () => {
      sandBox = sinon.sandbox.create();
      // igAccount = IGAccountFactory({ status: 'UNVERIFIED' }); //TODO: NO

      ({ igAccount } = await createUserAccountIGAccount());
      await igAccount.update({ status: 'UNVERIFIED' });

      job = new function () {
        return ({
          ...JobMethods,
          async update(props) {
            Object.assign(this, props);
          },
          attempts: 0,
        });
      }();
    });

    afterEach(()=>sandBox.restore());


    it('should download IGAccount Avatar', async () => {

      //const igAccount;

      //const { igAccount } = await createUserAccountIGAccount();
      //     const mockObjName = minioObj.create('v4', { payload: true });

      const IGAVAFixture = readFileSync(__dirname + '/../fixtures/kimkardashian-ig.html').toString();

      sandBox.stub(MClient.prototype,'getSignedPutObject').returns('http://127.0.0.1/put_photo_here');

      let minioClient = new MClient(); 

      const reqAsync = { 
        get: sinon.mock().resolves(IGAVAFixture)
      };

      const pipe = sinon.mock().returns({ on: (_,rs) => rs() });

      const reqPipe = {
        get: sinon.mock().returns({ pipe }),
        put: sinon.spy()
      }

      await DownloadIGAvaJobRun({ 
        minioClient,
        job, 
        reqAsync,
        reqPipe,
        IGAccount: igAccount,
      });

      //  console.log('>>>',igAccount.avatar);
      // console.log(minioObj.parse(igAccount.avatar));

      // console.log(igAccount.toJSON());
      //  assert.equal(igAccount.avatar,'x');


    });

    it('should verify a good IGAccount', async () => {
      agent = {
        exec:() => ({
          success: true,
          body: { login: true },
        }),
      };

      await VerifyIGJobRun({ job, IGAccount: igAccount, agent });
      assert.equal(igAccount.status, 'GOOD')

    });
    it('should fail a bad IGAccount', async () => {
      agent = {
        exec:() => ({
          success: true,
          body: { login: false, type: 'creds_error' },
        }),
      };
      await VerifyIGJobRun({ job, IGAccount: igAccount, agent });
      assert.equal(igAccount.status, 'FAILED')
    });

    it('should retry 3 times an unknown error logging in IGAccount', async () => {
      agent = {
        exec:() => ({
          success: true,
          body: { login: false, type: 'unknown' },
        }),
      };
      await VerifyIGJobRun({ job, IGAccount: igAccount, agent });
      assert.equal(igAccount.status, 'UNVERIFIED');

      assert.equal(job.attempts, 1);
      assert.equal(job.status, 'OPEN');

      await VerifyIGJobRun({ job, IGAccount: igAccount, agent });
      assert.equal(job.attempts, 2);
      assert.equal(job.status, 'OPEN');

      await VerifyIGJobRun({ job, IGAccount: igAccount, agent });
      assert.equal(job.attempts, 3);
      assert.equal(job.status, 'OPEN');

      await VerifyIGJobRun({ job, IGAccount: igAccount, agent });
      assert.equal(job.status, 'FAILED');

    });

  });

  describe('function PostJobRun', () => {
    describe('PostJob / IGDevice.full_dance 💃', () => {
      let minioClient;
      let IGAccount;
      let Post;
      let agent;
      let job;
      let photo;


      beforeEach(() => {
        minioClient = {
          pullPhoto: sinon.spy(() => Promise.resolve('/tmpfile')),
        };

        IGAccount = {
          username: 'username',
          password: 'password',
          fail: sinon.spy(() => Promise.resolve({})),
        };
        Post = {
          text: '#description',
          Photo: { objectName: 'objectName', uuid: 'uuid', bucket: 'uploads' },

        };
        agent = {
          exec: sinon.spy(async () => ({ success: true })),
        };

        job = new function () {
          return ({
            complete: sinon.mock().returns(Promise.resolve({})),
            fail: sinon.mock().returns(Promise.resolve({})),
            retryTimes() {
              sinon.mock().returns(Promise.resolve({}));
            },
            attempts: 0,
          });
        }();
        photo = {
          objectName: 'objectName',
        };
      });

      it('should download Post.Photo from minio store', async () => {
        await PostJobRun({
          job, agent, Post, IGAccount, minioClient,
        });
        assert.deepEqual(minioClient.pullPhoto.getCall(0).args[0], { name: 'objectName' });
      });

      it('should send \'full_dance\' cmd to python bridge with correct args', async () => {
        await PostJobRun({
          job, agent, Post, IGAccount, minioClient,
        });
        assert.deepEqual(
          agent.exec.getCall(0).args[0],
          {
            cmd: 'full_dance',
            args: {
              username: 'username',
              password: 'password',
              desc: '#description',
              localfile: '/tmpfile',
            },
          },
        );
      });

      it('should mark job as completed', async () => {
        await PostJobRun({
          job, agent, Post, IGAccount, minioClient,
        });
        assert(job.complete.calledOnce);
      });

      it('should fail job, and mark IGAccount as failed, when credentials are BAD', async () => {
        const body = {
          login: false,
          type: 'creds_error',
        };
        agent = {
          exec: async () => ({ success: false, body }),
        };
        await PostJobRun({
          job, agent, Post, IGAccount, minioClient,
        });
        assert(job.fail.calledOnce);
        assert(IGAccount.fail.calledOnce);
      });

      it('should job.retryTimes(n), when credentials results are unknown, failing on the 3rd try', async () => {
        job = new function () {
          return ({
            ...JobMethods,
            async update(props) {
              Object.assign(this, props);
            },
            attempts: 0,
          });
        }();

        agent = {
          exec: async () => ({ success: false, body: { login: false, type: 'unknown' } }),
        };

        await PostJobRun({
          job, agent, Post, IGAccount, minioClient,
        });
        assert.equal(job.attempts, 1);
        assert.equal(job.status, 'OPEN');
        await PostJobRun({
          job, agent, Post, IGAccount, minioClient,
        });
        assert.equal(job.attempts, 2);
        assert.equal(job.status, 'OPEN');
        await PostJobRun({
          job, agent, Post, IGAccount, minioClient,
        });
        assert.equal(job.attempts, 3);
        assert.equal(job.status, 'OPEN');
        await PostJobRun({
          job, agent, Post, IGAccount, minioClient,
        });
        assert.equal(job.attempts, 3);
        assert.equal(job.status, 'FAILED');
      });
    });
  });

  // TODO: MOVE THIS
  describe('class Agent', () => {
    const sandbox = sinon.sandbox.create();


    afterEach(() => {
      sandbox.restore();
    });

    it('should send an echo cmd to the python bridge', function (done) {
      this.timeout(5000);

      const agent = new Agent({ deviceId: 'adbId' });

      const bridge = agent.connect();

      agent.exec({ cmd: 'echo', args: { arg1: true } }).then((result) => {
        try {
          assert.deepEqual(result, {
            args: {
              arg1: true,
            },
            deviceId: 'adbId',
            method: 'echo',
          });
          done();
        } catch (e) {
          return done(e);
        }
      });
    });

    it('should send a testcmd to the python bridge', (done) => {
      const agent = new Agent({ deviceId: 'adbId' });

      const bridge = agent.connect();

      sandbox.stub(PythonShell.prototype, 'send').callsFake((data) => {
        try {
          assert.deepEqual(data, { deviceId: 'adbId', args: {}, method: '__testcmd__' });
        } catch (e) {
          done(e);
          throw e;
        }
      });

      agent.exec({ cmd: '__testcmd__', args: {} }).then((result) => {
        try {
          // TODO: change this use status codes 400 for bad request for example
          assert.deepEqual(result, { error: 'no input', code: 400, success: false });
          done();
        } catch (e) {
          return done(e);
        }
      });
    });
  });
});
