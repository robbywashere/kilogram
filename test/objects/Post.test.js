

const {
  Account, IGAccount, PostJob, Post, Photo, User,
} = require('../../objects');

const ObjectRegistry = require('../../objects');

const sinon = require('sinon');
const assert = require('assert');
const sequelize = require('sequelize');
const sync = require('../../db/sync');
const SEQ = require('../../db');
const Promise = require('bluebird');
const {
  createUserAccountIGAccountPhotoPost,
  initJob, ezUser, newIGAccount, ezUserAccount, createUserPostJob, createAccountUserPost, createAccountUserPostJob,
} = require('../helpers');
const { logger } = require('../../lib/logger');
const {
  zipObject, startCase, constant, times,
} = require('lodash');

describe('objects/Post', () => {
  beforeEach(async () => await sync(true));

  it('should destroy PostJob<OPEN> when itself is destroyed', async () => {
    const {
      user, account, igAccount, photo, post,
    } = await createUserAccountIGAccountPhotoPost();

    let pj = await initJob(post);

    await post.destroy();

    assert(!(await PostJob.findById(1)))

  });

  it ('should scope SUCCESS/published posts where PostJob is SUCCESS', async ()=>{

    const {
      user, account, igAccount, photo, post,
    } = await createUserAccountIGAccountPhotoPost();

    const job = await initJob(post);

    const posts1 = await Post.published();

    assert.equal(posts1.length, 0)

    await job.update({ status: 'SUCCESS' });

    const posts2 = await Post.published();

    assert.equal(posts2.length, 1)

  });
  it ('should scope FAILED/not published Posts where PostJob is FAILED', async ()=>{

    const {
      user, account, igAccount, photo, post,
    } = await createUserAccountIGAccountPhotoPost();

    const job = await initJob(post);

    const posts1 = await Post.failed();

    assert.equal(posts1.length, 0)

    await job.update({ status: 'FAILED' });

    const posts2 = await Post.failed();

    assert.equal(posts2.length, 1)

  });


  it('should be destroyed when Account is destroyed', async () => {
    const {
      user, account, igAccount, photo, post,
    } = await createUserAccountIGAccountPhotoPost();

    assert((await Post.findById(post.id)));
    await account.destroy();
    assert(!(await Post.findById(post.id)));
  });

  it('should be destroyed when its IGAccount is destroyed', async () => {
    const {
      user, account, igAccount, photo, post,
    } = await createUserAccountIGAccountPhotoPost();

    assert((await Post.findById(post.id)));
    await igAccount.destroy();
    assert(!(await Post.findById(post.id)));
  });


  it('should find due posts with .due', async () => {
    const { post } = await createAccountUserPost();

    await initJob(post);

    const pd = await Post.due();

    assert(pd);
  });

  it('should respond to reloadWithJob withJob with .Job object', async () => {
    const { post } = await createAccountUserPostJob();
    post.reloadWithJob();
    assert(post.PostJob);
  });


  it.skip('should respond to withUserForId with .User object', async () => {
    const { post } = await createAccountUserPostJob();

    const p = await Post.withUsersForId(post.id);
    assert(p.User);
  });
});
