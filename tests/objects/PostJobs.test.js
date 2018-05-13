const { IGAccount, Account, PostJob, Post, Photo, User } = require('../../objects');
const sinon = require('sinon');
const assert = require('assert');
const sync = require('../../db/sync');
const Promise = require('bluebird');
const { createAccountUserPostJob, createAccountUserPost, createUserPostJob } = require('../helpers');


describe('objects/PostJob', function(){

  beforeEach(async ()=> {
    return await sync(true);
  });


  it('should respond to withPost and withPostForId with a .Post object with a .Photo object', async function(){


    const { post }  = await createAccountUserPostJob();

    const job1 = await PostJob.withPost({ where: {id: post.PostJob.id }})
    const job2 = await PostJob.withPostForId(post.PostJob.id)
    assert(job1[0].Post.Photo)
    assert(job2.Post.Photo)

  })
  it ('should respond to reloadWithPost with a .Post object with a .Photo object', async function(){


    const { post }  = await createAccountUserPostJob();

    const job = await PostJob.findById(post.PostJob.id)
    const j = await job.reloadWithPost();
    assert(j.Post.Photo)

  })

  it.skip('should respond to withAllForId with job.Post, job.Post.Photo, job.IGAccount',async function(){

    const { post }  = await createAccountUserPostJob();

    const job = await PostJob.withAllForId(post.PostJob.id);

    assert(job.Post);
    assert(job.Post.Photo);
    assert(job.IGAccount)

  })

  it('should .popJob - giving a single job returning a job from the db while updating that job as inprog: true', async function(){


    const { post }  = await createAccountUserPostJob();

    const job = await PostJob.findById(post.PostJob.id, { 
      include: [ { model: IGAccount }, { model: Post, include: [ { model: Photo } ] } ] 
    });

    const j = await PostJob.popJob();

    assert(j.inprog);

  })

  it('should include Post, Account, and Post.Photo', async function(){

    const { post }  = await createAccountUserPostJob();

    const job = await PostJob.findById(post.PostJob.id, { 
      include: [ { model: IGAccount }, { model: Post, include: [ { model: Photo } ] } ] 
    });

    assert(job.Post);
    assert(job.Post.Photo);
    assert(job.IGAccount);


  })

  it('should report outstanding jobs', async function(){

    const account = await Account.create();
    const igAccount = await IGAccount.create({ AccountId: account.id, username: 'xxxxx', password:'xxxxx' });

    const j = await PostJob.create({
      AccountId: account.id,
      IGAccountId: igAccount.id,
      args: { arg1: 1 },
      cmd: 'cmd',
    })

    const jNot = await PostJob.create({
      AccountId: account.id,
      IGAccountId: igAccount.id,
      args: { arg1: 1 },
      cmd: 'cmd',
      inprog: true,
      finish: false
    })

    const jNot2 = await PostJob.create({
      AccountId: account.id,
      IGAccountId: igAccount.id,
      args: { arg1: 1 },
      cmd: 'cmd',
      inprog: false,
      finish: true
    })

    let jOut = await PostJob.outstanding();

    assert.equal(1, jOut.length)

    assert.equal(j.id, jOut[0].id)
  })




})
