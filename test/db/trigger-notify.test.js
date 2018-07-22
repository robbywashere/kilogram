
const {
  BucketEvents, Account, Photo, IGAccount, Notification, PostJob, Post
} = require('../../objects');
const dbSync = require('../../db/sync');
const { delay } = require('bluebird');
const assert = require('assert');
const Promise = require('bluebird');
const { logger } = require('../../lib/logger');
const minioObject = require('../../server-lib/minio/minioObject');
const { MClient } = require('../../server-lib/minio');
const Watcher = require('../../db/postgres-triggers/watch');
const { initJob, createUserAccountIGAccountPhotoPost } = require('../helpers');
const PGListen = require('../../server-lib/pg-listen');
const EventEmitter = require('../../lib/eventEmitter');
const uuidv4 = require('uuid').v4;
const { get } = require('lodash');

const minioEventFixture = require('../fixtures/minio-event.json');

describe('trigger notify functionality', () => {
  let watcher = {};

  beforeEach(() => dbSync(true));
  afterEach(() => ((typeof watcher.disconnect === 'function') ? watcher.disconnect() : null));

  // TODO: move
  it('should persist PGListen connections', async function () {
    this.timeout(8500);

    return new Promise((resolve, reject) => {
      try {
        let allowConnect = true;
        let count = 0;

        const pgClient = class Client extends EventEmitter {
          connect() {
            count++;
            if (count === 4) {
              allowConnect = true;
              this.on('connect', resolve);
            }
            if (allowConnect) process.nextTick(() => this.emit('connect'));
            else {
              process.nextTick(() => this.emit('end'));
            }
          }
        };
        const pgListener = new PGListen({ debug: true, pgClient });
        pgListener.connect();
        allowConnect = false;
        pgListener.client.emit('end');
      } catch (e) {
        reject(e);
      }
    });
  });

  it.skip('TODO: should be able to listen for Notification triggers created by PostJob status change', async function(){


    const {
      user, account, igAccount, photo, post,
    } = await createUserAccountIGAccountPhotoPost();

    watcher = new Watcher({ debug: logger.debug });

    await watcher.connect();


    const Q = new Promise((rs, rx) => {
      watcher.subscribe(Notification.TableTriggers.after_insert, (payload) => {

        logger.debug(JSON.stringify(payload,null,4));
        
        const { data: { body: { data: { PostJob: { status, PostId, AccountId } }  } } } = payload;
        try {
          assert.equal(status, 'SUCCESS');
          assert.equal(AccountId, igAccount.id);
          assert.equal(PostId, post.id);
          return rs();
        } catch (e) {
          rx(e);
        }
      });
    });


    const job = await initJob(post);

    const posts1 = await Post.published();

    assert.equal(posts1.length, 0)

    await job.update({ status: 'SUCCESS' });

    return Q;
  
  
  
  });


  it('should update a Photo object on upload minio event', async function () {
    this.timeout(5000);

    const account = await Account.create({});
    const uuid = uuidv4();

    const photo = await Photo.createPostPhoto({ uuid });
    //const objectName = minioObject.create('v4', { uuid });

    watcher = new Watcher({ debug: logger.debug });
    await watcher.connect();
    const Q = new Promise((rs, rx) => {
      watcher.subscribe(BucketEvents.TableTriggers.after_insert, async (payload) => {
        try {
          const eventName = get(payload, 'data.value.Records[0].eventName');
          const key = get(payload, 'data.key');
          if (eventName === 's3:ObjectCreated:Put') {
            await MClient.PutPhotoFn({
              key,
              bucket: 'mybucket',
            });
          }
          return rs();
        } catch (e) {
          rx(e);
        }
      });
    });
    process.nextTick(() =>BucketEvents.create({
      key: photo.objectName,
      value: minioEventFixture,
    }));
    await Q;


    assert.equal((await Photo.uploaded()).length, 1); 
  
  
  });


  it('should should make a table triggerable', async function () {
    this.timeout(5000);
    watcher = new Watcher({ debug: logger.debug });
    await watcher.connect();
    const photoUUID = uuidv4();
    const Q = new Promise((rs, rx) => {
      watcher.subscribe(Photo.TableTriggers.after_insert, (payload) => {
        try {
          const { objectName } = payload.data;
          const { uuid } = minioObject.parse(objectName);
          assert.equal(uuid, photoUUID);
          return rs();
        } catch (e) {
          rx(e);
        }
      });
    });
    process.nextTick(() => Photo.createPostPhoto({ uuid: photoUUID }));
    return Q;
  });


  // TODO define a custom Object instead of using IGAccount
  it('IGAccount object columns should be \'triggerable\'', async function () {
    this.timeout(5000);

    watcher = new Watcher({ debug: logger.debug });

    await watcher.connect();

    const account = await Account.create();

    const ig = await IGAccount.create({
      username: 'ribbit',
      password: 'secret',
      AccountId: account.id,
    });


    const Q = new Promise((rs, rx) => {
      watcher.subscribe(IGAccount.Triggerables.status, (payload) => {
        const { data: { status, id, AccountId } } = payload;
        try {
          assert.equal(status, 'GOOD');
          assert.equal(id, ig.id);
          assert.equal(AccountId, ig.AccountId);
          return rs();
        } catch (e) {
          rx(e);
        }
      });
    });

    process.nextTick(() => ig.update({ status: 'GOOD' }));

    return Q;
  });
});
