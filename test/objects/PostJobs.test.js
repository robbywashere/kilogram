const {
  Notification, IGAccount, Account, PostJob, Post, Photo, User,
} = require('../../objects');
const sinon = require('sinon');
const assert = require('assert');
const sync = require('../../db/sync');
const Promise = require('bluebird');
const sequelize = require('sequelize');
const {
  initJob,
  ezUserAccount, newIGAccount, createAccountUserPostJob, createAccountUserPost, createUserPostJob,
createUserAccountIGAccountPhotoPost
} = require('../helpers');
const { times, constant } = require('lodash');


describe('objects/PostJob', () => {
  beforeEach(async () => await sync(true));

  it('should only initPostJobs for Posts with verified IGAccounts', async () => {
    const user = await ezUserAccount();
    const account = user.Accounts[0];
    const igaccount = await newIGAccount(user);
    await igaccount.fail();
    const photo = await Photo.createPostPhoto({});

    const props = {
      postDate: sequelize.fn('NOW'),
      UserId: user.id,
      AccountId: account.id,
      IGAccountId: igaccount.id,
      photoUUID: photo.uuid,
    };


    const post = await Post.create(props);

    await PostJob.initPostJobs();
    const jobSearch1 = await PostJob.findAll();
    assert.equal(jobSearch1.length,0);

    await igaccount.good();

    await PostJob.initPostJobs();
    const jobSearch2 = await PostJob.findAll();
    assert.equal(jobSearch2.length,1);

  });


  it('should create jobs for all outstanding posts with .initPostJobs', async () => {
    const user = await ezUserAccount();
    const account = user.Accounts[0];
    const igaccount = await newIGAccount(user);
    await igaccount.good();
    const photo = await Photo.createPostPhoto({});

    const props = {
      postDate: sequelize.fn('NOW'),
      UserId: user.id,
      AccountId: account.id,
      IGAccountId: igaccount.id,
      photoUUID: photo.uuid,
    };


    await Post.bulkCreate(times(9, constant(props)));
    await PostJob.initPostJobs();
    // Run again to assure no dupes 
    await PostJob.initPostJobs();
    const jobs = await PostJob.findAll();
    assert.equal(9, jobs.length);
  });



  it('TODO: should create a Notification when PostJob.status is updated', async ()=>{

    const {
      user, account, igAccount, photo, post,
    } = await createUserAccountIGAccountPhotoPost();

    const job = await initJob(post);

    const posts1 = await Post.published();

    assert.equal(posts1.length, 0)

    await job.update({ status: 'SUCCESS' });

    const posts2 = await Post.published();

    assert.equal(posts2.length, 1)

    let notif;
    while ( !(notif = await Notification.findAll()).length ) {
      await Promise.delay(0);
    }

    assert.equal(notif.length, 1);

    assert.equal(notif[0].body.data.PostJob.PostId, posts2[0].id);

    assert.equal(notif[0].body.data.PostJob.status, 'SUCCESS');
    

  });


  it('should respond to withPost and withPostForId with a .Post object with a .Photo object', async () => {
    const { post } = await createAccountUserPostJob();

    const job1 = await PostJob.withPost({ where: { id: post.PostJob.id } });
    const job2 = await PostJob.withPostForId(post.PostJob.id);
    assert(job1[0].Post.Photo);
    assert(job2.Post.Photo);
  });
  it('should respond to reloadWithPost with a .Post object with a .Photo object', async () => {
    const { post } = await createAccountUserPostJob();

    const job = await PostJob.findById(post.PostJob.id);
    const j = await job.reloadWithPost();
    assert(j.Post.Photo);
  });

  it.skip('should respond to withAllForId with job.Post, job.Post.Photo, job.IGAccount', async () => {
    const { post } = await createAccountUserPostJob();

    const job = await PostJob.withAllForId(post.PostJob.id);

    assert(job.Post);
    assert(job.Post.Photo);
    assert(job.IGAccount);
  });

  it('should .popJob - giving a single job returning a job from the db while updating that job as SPINNING', async () => {
    const { post } = await createAccountUserPostJob();

    const job = await PostJob.findById(post.PostJob.id, {
      include: [{ model: IGAccount }, { model: Post, include: [{ model: Photo }] }],
    });

    const j = await PostJob.popJob();

    assert.equal(j.status, 'SPINNING');
  });

  it('should include Post, Account, and Post.Photo', async () => {
    const { post } = await createAccountUserPostJob();

    const job = await PostJob.findById(post.PostJob.id, {
      include: [{ model: IGAccount }, { model: Post, include: [{ model: Photo }] }],
    });

    assert(job.Post);
    assert(job.Post.Photo);
    assert(job.IGAccount);
  });

  it('should report outstanding jobs', async () => {
    const account = await Account.create();
    const igAccount = await IGAccount.create({ AccountId: account.id, username: 'xxxxx', password: 'xxxxx' });

    const j = await PostJob.create({
      AccountId: account.id,
      IGAccountId: igAccount.id,
      args: { arg1: 1 },
      cmd: 'cmd',
    });

    const jNot = await PostJob.create({
      AccountId: account.id,
      IGAccountId: igAccount.id,
      args: { arg1: 1 },
      cmd: 'cmd',
      status: 'SPINNING',
    });

    const jNot2 = await PostJob.create({
      AccountId: account.id,
      IGAccountId: igAccount.id,
      args: { arg1: 1 },
      cmd: 'cmd',
      status: 'FAILED',
    });

    const jOut = await PostJob.outstanding();

    assert.equal(1, jOut.length);

    assert.equal(j.id, jOut[0].id);
  });
});
