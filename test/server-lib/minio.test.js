const { retryConnRefused, MClient, WrapMinioClient } = require('../../server-lib/minio');

const Routes = require('../../controllers/minio');

const { signedURL } = require('../../server-lib/minio/middlewares');

const EventEmitter = require('../../lib/eventEmitter');

const { Duplex } = require('stream');

const http = require('http');

const minioObj = require('../../server-lib/minio/minioObject');

const sinon = require('sinon');

const Minio = require('minio');

const Promise = require('bluebird');

const assert = require('assert');

const DBSync = require('../../db/sync');

const { ezUser, request, exprezz,  } = require('../helpers');

const dbsync = require('../../db/sync');

const { set } = require('lodash');

const uuidv4 = require('uuid/v4');

const uuid = require('uuid');

const objects = require('../../models');

const { Account, Photo } = objects;

describe('MClient class', () => {
  describe('WrapMinioClient', () => {
    describe('>>>', () => {
      let callCount = 0;
      let sandbox;
      beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(http, 'request').callsFake(() => {
          callCount++;
          const s = new Duplex();
          const err = new Error('ERROR CONN REFUSED');
          err.code = 'ECONNREFUSED';
          process.nextTick(() => s.emit('error', err));
          return s;
        });
      });
      afterEach(() => {
        sandbox.restore();
        callCount = 0;
      });
      it('should Pass custom wrapped client to constructor', async () => {
        const transport = http;
        const client = WrapMinioClient(
          new Minio.Client({ endPoint: '127.0.0.1', transport, secure: false }),
          { retryDelayFn: () => 0 },
        );
        const mc = new MClient({ bucket: 'bucket', client });

        try {
          await mc.client.listBuckets();
        } catch (e) {
          assert.equal(e.code, 'ECONNREFUSED');
        }
        assert.equal(callCount, 6);
      });
    });
    it('should wrap minio client to recover from error connection refusedes', async () => {
      let callCount = 0;

      const Client = function () {};
      Client.prototype.listBuckets = async function listBuckets() {
        callCount++;
        const err = new Error('ERROR CONN REFUSED');
        err.code = 'ECONNREFUSED';
        throw err;
      };
      const c = new Client();
      const wrappedClient = WrapMinioClient(c, { retryDelayFn: () => 1 });

      try {
        await wrappedClient.listBuckets();
      } catch (e) {
        assert.equal(e.code, 'ECONNREFUSED');
      }
      assert.equal(callCount, 6);
    });
  });

  describe('retryConnRefused', () => {
    describe('>>>', () => {
      beforeEach(() => {
        sinon.stub(Promise, 'delay').resolves();
      });
      afterEach(() => {
        Promise.delay.restore();
      });

      it('should attempt given fn, retrying on on error.code == ECONNREFUSED, retrying N times before throwing an error', async () => {
        const expectedError = new Error('ThEre WaS eRrOr');

        const fn = sinon.spy(async () => {
          const e = expectedError;
          e.code = 'ECONNREFUSED';
          throw e;
        });
        try {
          await retryConnRefused({
            fn,
            max: 5,
            retryDelayFn: () => 0,
          }); // because fast testing
        } catch (err) {
          assert.equal(expectedError, err);
        }
        assert.equal(fn.callCount, 6);
      });
    });
  });

  describe('sqs event for bucket setup', () => {
    it('should create sqs events for a given bucket', async () => {
      const client = {};

      client.setBucketNotification = sinon.stub().resolves(true);

      const mc = new MClient({ client });

      await mc.createBucketNotifications({
        events: ['fake_event1', 'fake_event2'],
        bucket: 'myWildBucket',
        sqsArn: 'sqs:arn',
      });

      const [bucket, notifyConfig] = client.setBucketNotification.getCall(0).args;

      assert.equal(bucket, 'myWildBucket');

      assert(notifyConfig instanceof Minio.NotificationConfig);

      const { Queue, Event } = notifyConfig.QueueConfiguration[0];

      assert.equal(Queue, 'sqs:arn');

      assert.deepEqual(Event, ['fake_event1', 'fake_event2']);
    });
  });
  describe('bucket setup', () => {
    it.skip('should attempt to createBucket when it doesnt exist', async () => {
      const client = {};
      const err = new Error('');
      err.code = 'NoSuchBucket';
      client.makeBucket = sinon.spy();
      client.bucketExists = sinon.stub().rejects(err);

      const mc = new MClient({ client, bucket: 'bucket' });

      mc.createBucket({ client, bucket: 'bucket', region: 'region' });

      // TODOassert(client.makeBucket.calledWith('bucket','region'))
    });

    it('should skip createBucket when it does exist', async () => {
      const client = {};
      client.makeBucket = sinon.spy();
      client.bucketExists = sinon.stub().resolves();
      const mc = new MClient({ client, bucket: 'bucket' });
      mc.createBucket({ client, bucket: 'bucket', region: 'region' });
      // TODO assert(client.makeBucket.calledWith('bucket','region'))
    });
    describe('pullPhoto', () => {
      it('should pull a photo and store it locally', async () => {
        const client = {
          fGetObject: sinon.mock().returns(Promise.resolve()),
        };
        const mc = new MClient({ client, bucket: 'bucket' });
        const file = await mc.pullPhoto({ name: 'xyz', tmpDir: '/dev/null' });
        assert.equal('/dev/null/xyz', file);
        assert(client.fGetObject.calledWith('bucket', 'xyz', '/dev/null/xyz'));
      });
    });
  });

  describe('listen', () => {
    it('should register minio listener and add notification to the event emitter', () => {
      const client = {};
      const spyFn = sinon.spy();
      client.listenBucketNotification = sinon.mock().returns({
        on: spyFn,
      });
      const eventFn = () => {};
      const mc = new MClient({ client, bucket: 'bucket' });
      mc.listen({ events: eventFn });
      assert(client.listenBucketNotification.calledWith('bucket', '', '', [
        's3:ObjectCreated:*',
        's3:ObjectRemoved:*',
      ]));
      assert(spyFn.calledWith('notification', eventFn));
    });

    describe('MClient', () => {
      let photoCreate;
      let photoDelete;

      beforeEach(() => {
        photoCreate = sinon.stub(Photo, 'create').returns(Promise.resolve());
        photoDelete = sinon.stub(Photo, 'setDeleted').returns(Promise.resolve());
      });
      afterEach(() => {
        photoCreate.restore();
        photoDelete.restore();
      });

      it.skip('MClient.init() should setup PhotoEvents with listener', async () => {
        const putRecord = {};
        const uuid = uuidv4();
        const key = minioObj.create('v4', { uuid, accountId: 1 });
        set(putRecord, 's3.object.key', key);
        set(putRecord, 's3.bucket.name', 'puttestBucket');
        set(putRecord, 'eventName', 's3:ObjectCreated:Put');

        const delRecord = {};
        set(delRecord, 's3.object.key', key);
        set(delRecord, 's3.bucket.name', 'deltestBucket');
        set(delRecord, 'eventName', 's3:ObjectRemoved:Deleted');

        const ee = new EventEmitter();
        const client = {
          listenBucketNotification: () => ee,
        };
        const mc = new MClient({ client, bucket: 'bucket' });

        mc.createBucket = () => Promise.resolve();

        await mc.init();

        ee.emit('notification', putRecord);
        ee.emit('notification', delRecord);

        assert.deepEqual(photoCreate.getCall(0).args[0], {
          bucket: 'puttestBucket',
          objectName: key,
          uuid,
          AccountId: 1,
        });

        assert(photoDelete.calledWith(key));
      });
    });
  });
  describe('static Event', () => {
    it('should respond to put and delete events ', async () => {
      const putRecord = {};
      const uuid = uuidv4();
      const key = minioObj.create('v4', { uuid });
      set(putRecord, 's3.object.key', key);
      set(putRecord, 's3.bucket.name', 'puttestBucket');
      set(putRecord, 'eventName', 's3:ObjectCreated:Put');

      const delRecord = {};
      set(delRecord, 's3.object.key', key);
      set(delRecord, 's3.bucket.name', 'deltestBucket');
      set(delRecord, 'eventName', 's3:ObjectRemoved:Deleted');

      const putFn = sinon.stub().resolves(putRecord);
      const delFn = sinon.stub().resolves(delRecord);
      const eventFn = MClient.Event({ putFn, delFn });
      eventFn(putRecord);
      eventFn(delRecord);

      assert.deepEqual(putFn.getCall(0).args[0], {
        record: putRecord,
        key,
        bucket: 'puttestBucket',
      });
      assert.deepEqual(delFn.getCall(0).args[0], {
        key,
      });
    });

    it('should update Photo db object on put and delete', async () => {
      await DBSync(true);

      const bucket = 'testBucket';

      const photo = await Photo.createPostPhoto();

      const uuid = photo.uuid;

      const key = photo.objectName;

      const putRecord = {};

      set(putRecord, 's3.object.key', key);
      set(putRecord, 's3.bucket.name', bucket);
      set(putRecord, 'eventName', 's3:ObjectCreated:Put');

      const delRecord = {};
      set(delRecord, 's3.object.key', key);
      set(delRecord, 's3.bucket.name', bucket);
      set(delRecord, 'eventName', 's3:ObjectRemoved:Deleted');
      const eventHandler = MClient.PhotoEvents();

      await eventHandler(putRecord);
      assert(await Photo.scope('uploaded').findOne());
      await eventHandler(delRecord);
      assert(await Photo.scope('deleted').findOne());
    });
  });

  describe('signedURL', () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => dbsync(true));
    afterEach(() => {
      sandbox.restore();
    });
    it('should return a signed url', async () => {
      const user = await ezUser({ Accounts: {} }, { include: [objects.Account] });
      const client = new MClient({
        client: {
          async presignedPutObject() {
            return 'http://fakeurl/photo';
          },
        },
      });

      const router = Routes({ minioClient: client });

      const app = exprezz(user);

      app.use(router);

      const res = await request(app)
        .post('/url')
        .send({ AccountId: user.Accounts[0].id })
        .expect(200);

      const newPhoto = await Photo.findOne();

      assert.deepEqual(res.body, {
        objectName: newPhoto.objectName,
        url: 'http://fakeurl/photo',
        uuid: newPhoto.uuid,
      });
    });

    it('should throw a 401 error when no user is on req obj and requests a signedurl', async () => {
      const client = new MClient({
        client: {
          async presignedPutObject() {
            return 'http://fakeurl/photo';
          },
        },
      });

      const router = Routes({ minioClient: client });

      const app = exprezz();

      app.use(router);

      const res = await request(app)
        .post('/url')
        .send({ name: 'filename.jpg', AccountId: 1 })
        .expect(401);
    });

    it.skip('should next(ERR) on bad mime type', async () => {});
  });
});
