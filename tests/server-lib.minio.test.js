const { 
  retryConnRefused, 
  signedURL, 
  MClient,
  WrapMinioClient,
} = require('../server-lib/minio');

const EventEmitter = require('events');

const { Duplex } = require('stream');

const http = require('http');

const minioObj = require('../server-lib/minio/minioObject');
const sinon = require('sinon');

const Minio = require('minio');
const Promise = require('bluebird');

const assert = require('assert');

const DBSync = require('../db/sync');

const { set } = require('lodash');

const uuidv4 = require('uuid/v4');

const objects = require('../objects');
const { Photo } = objects; 


describe('MClient class', function(){


  describe('WrapMinioClient', function(){
    describe('>>>' ,function(){
      let callCount = 0;
      let sandbox;
      beforeEach(function(){
        sandbox = sinon.sandbox.create();
        sandbox.stub(http, "request").callsFake(()=>{
          callCount++;
          const s = new Duplex();
          const err = new Error('ERROR CONN REFUSED');
          err.code = 'ECONNREFUSED';
          process.nextTick(()=>s.emit('error', err))
          return s;
        });
      })
      afterEach(function(){
        sandbox.restore(); 
      })
      it('should Pass custom wrapped client to constructor',
        async function(){

          const transport = http;
          const client = WrapMinioClient((new Minio.Client({ endPoint: '127.0.0.1', transport, secure: false })),{ retryDelayFn: ()=>0 });
          const mc = new MClient({ bucket: 'bucket', client })

          try {
            await mc.client.listBuckets();
          } catch(e) {
            assert.equal(e.code, 'ECONNREFUSED');
          }
          assert.equal(callCount, 6)

        })

    })
    it('should wrap minio client to recover from error connection refusedes', async function(){


      let callCount = 0;

      const Client = function(){}
      Client.prototype.listBuckets =async function listBuckets(){
        callCount++;
        const err = new Error('ERROR CONN REFUSED');
        err.code = 'ECONNREFUSED';
        throw err;
      }
      const c = new Client();
      const wrappedClient = WrapMinioClient(c, { retryDelayFn:  ()=>1 });

      try {
        await wrappedClient.listBuckets();
      } catch(e) {
        assert.equal(e.code, 'ECONNREFUSED');
      }
      assert.equal(callCount, 6)





    })

  })

  describe('retryConnRefused', function(){

    describe('>>>',function(){

      beforeEach(function(){
        sinon.stub(Promise,'delay').resolves();
      })
      afterEach(function(){
        Promise.delay.restore();
      })


      it ('should attempt given fn, retrying on on error.code == ECONNREFUSED, retrying 5 times before throwing an error', async function(){

        const fn = sinon.spy(async () => { const e = new Error('Error'); e.code = 'ECONNREFUSED'; throw e })
        try {
          await retryConnRefused(fn)
        } catch(e) {
          assert.equal(e.toString().split("\n")[0],"Error: Could not connect to MINIO storage") 
        }
        assert.equal(fn.callCount,6);
      });
    })
  })
  describe('bucket setup',function(){

    it ('should attempt to createBucket when it doesnt exist', async function(){
      const client = {};
      let err = new Error('');
      err.code = 'NoSuchBucket';
      client.makeBucket = sinon.spy();
      client.bucketExists = sinon.stub().rejects(err);

      const mc = new MClient({ client, bucket: 'bucket' })

      mc.createBucket({ client, bucket: 'bucket', region: 'region' });

      //TODOassert(client.makeBucket.calledWith('bucket','region'))

    })

    it ('should skip createBucket when it does exist', async function(){
      let client = {};
      client.makeBucket = sinon.spy();
      client.bucketExists = sinon.stub().resolves();
      const mc = new MClient({ client, bucket: 'bucket' })
      mc.createBucket({ client, bucket: 'bucket', region: 'region' });
      //TODO assert(client.makeBucket.calledWith('bucket','region'))
    })
    describe('pullPhoto', function(){
      it ('should pull a photo and store it locally', async function(){
        const client = {
          fGetObject: sinon.mock().returns(Promise.resolve())
        }
        const mc = new MClient({ client, bucket: 'bucket' })
        const file = await mc.pullPhoto({ name: 'xyz', tmpDir: '/dev/null' })
        assert.equal('/dev/null/xyz', file);
        assert(client.fGetObject.calledWith('bucket','xyz','/dev/null/xyz'))
      })

    })
  })


  describe('listen', function(){

    it (`should register minio listener and add notification to the event emitter`, function(){

      let client = {};
      const spyFn = sinon.spy();
      client.listenBucketNotification =  sinon.mock().returns({
        on: spyFn 
      })
      const eventFn = ()=>{};
      const mc = new MClient({ client, bucket: 'bucket' })
      mc.listen({ events: eventFn });
      assert(client.listenBucketNotification.calledWith('bucket','','',[ 's3:ObjectCreated:*', 's3:ObjectRemoved:*' ]))
      assert(spyFn.calledWith('notification',eventFn))
    })

    describe('MClient', function(){


      let photoCreate; 
      let photoDelete;

      beforeEach(function(){
        photoCreate = sinon.stub(Photo,'create').returns(Promise.resolve());
        photoDelete = sinon.stub(Photo,'setDeleted').returns(Promise.resolve());
      })
      afterEach(function(){
        photoCreate.restore();
        photoDelete.restore();
      })

      it(`MClient.init() should setup PhotoEvents with listener`, async function(){


        let putRecord = {}
        const uuid = uuidv4();
        const key = minioObj.create('v2',{ uuid });
        set(putRecord,'s3.object.key',key);
        set(putRecord,'s3.bucket.name','puttestBucket');
        set(putRecord,'eventName', 's3:ObjectCreated:Put');

        let delRecord = {}
        set(delRecord,'s3.object.key',key);
        set(delRecord,'s3.bucket.name','deltestBucket');
        set(delRecord,'eventName', 's3:ObjectRemoved:Deleted');




        const ee =  new EventEmitter();
        const client = {
          listenBucketNotification: ()=> ee
        }
        const mc = new MClient({ client, bucket: 'bucket' });

        mc.createBucket = ()=>Promise.resolve();

        await mc.init();

        ee.emit('notification', putRecord);
        ee.emit('notification', delRecord);

        assert(photoCreate.calledWith({ bucket: 'puttestBucket', objectName: key}))
        assert(photoDelete.calledWith(key))


      })

    })


  })
  describe('static Event', function(){
    it ('should respond to put and delete events ', async function(){

      let putRecord = {}
      const uuid = uuidv4();
      const key = minioObj.create('v2',{ uuid });
      set(putRecord,'s3.object.key',key);
      set(putRecord,'s3.bucket.name','puttestBucket');
      set(putRecord,'eventName', 's3:ObjectCreated:Put');

      let delRecord = {}
      set(delRecord,'s3.object.key',key);
      set(delRecord,'s3.bucket.name','deltestBucket');
      set(delRecord,'eventName', 's3:ObjectRemoved:Deleted');


      const putFn = sinon.stub().resolves(putRecord);
      const delFn = sinon.stub().resolves(delRecord);
      const eventFn = MClient.Event({ putFn, delFn });
      eventFn(putRecord);
      eventFn(delRecord);

      assert.deepEqual(putFn.getCall(0).args[0], {
        record: putRecord,
        key,
        bucket: 'puttestBucket'
      });
      assert.deepEqual(delFn.getCall(0).args[0], {
        key,
      });


    })

    it('should update/create Photo db object on put and delete', async function(){
      await DBSync(true);

      const bucket = 'testBucket';

      const uuid = uuidv4();
      const meta = { uuid }
      const key = minioObj.create('v2',meta)
      let putRecord = {}
      set(putRecord,'s3.object.key',key);
      set(putRecord,'s3.bucket.name',bucket);
      set(putRecord,'eventName', 's3:ObjectCreated:Put');

      let delRecord = {}
      set(delRecord,'s3.object.key',key);
      set(delRecord,'s3.bucket.name',bucket);
      set(delRecord,'eventName', 's3:ObjectRemoved:Deleted');
      const eventHandler = MClient.PhotoEvents();

      await eventHandler(putRecord);
      const ps = await Photo.findAll();
      const pMeta = (await Photo.findAll())[0].get('meta');
      assert.deepEqual(meta,pMeta);

      await eventHandler(delRecord);

      assert((await Photo.findAll())[0].get('deleted'));


    })


  });

  describe('signedURL', function(){

    it('should return a signed url', async function(){
      let client = {
        newPhoto: sinon.stub().resolves('http://fakeurl/photo')
      };
      const su = signedURL({ client });
      let req = { query: { name: 'filename.jpg' } }
      let res = { end: sinon.spy() };
      let next = sinon.spy();
      await su(req, res, next);
      assert(res.end.calledWith('http://fakeurl/photo'))

    })
    it.skip('should next(ERR) on bad extension', async function(){
      let client = {
        newPhoto: sinon.stub().resolves('http://fakeurl/photo')
      };
      const su = signedURL({ client });
      let req = { query: { name: 'filename.IM_BAD' } }
      let res = { end: sinon.spy() };
      let next = sinon.spy();
      await su(req, res, next);
      assert.equal(next.getCall(0).args.toString(),'Error: Invalid extension')

    })


  })


})






