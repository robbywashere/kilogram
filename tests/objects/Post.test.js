

const { Account, IGAccount, PostJob, Post, Photo, User } = require('../../objects');

const ObjectRegistry = require('../../objects');

const sinon = require('sinon');
const assert = require('assert');
const sequelize = require('sequelize');
const sync = require('../../db/sync');
const SEQ = require('../../db');
const Promise = require('bluebird');
const { ezUser, newIGAccount, ezUserAccount, createUserPostJob, createAccountUserPost, createAccountUserPostJob  } = require('../helpers');
const { zipObject, constant, times } = require('lodash');
const minioObj = require('../../server-lib/minio/minioObject');

const { denormalizeJobBody } = require('../../objects/_helpers');

describe('objects/Post', function(){

  beforeEach(async ()=> {
    return await sync(true);
  });

  it.skip('should adhere to Policy', async function(){

    const user = await ezUser({
     superAdmin: true 
    });
    const user2 = await ezUser({
    });
    let post = await Post.create({
      postDate: sequelize.fn('NOW'),
      UserId: user.id,
      Photo: {
        bucket: 'uploads',
        objectName: minioObj.create('v2',{ payload: true })
      }
    },{
      include: [ Photo ]
    })

  })


  //TODO: Move me somewhere? PostJobs test?
  it.skip('should create generic job for all outstanding posts with .initJobs2', async function(){
  
    const user = await ezUserAccount();
    const account = user.Accounts[0];
    const igaccount = await newIGAccount(user);
    const photo = await Photo.create({});

    const props = {
      postDate: sequelize.fn('NOW'),
      UserId: user.id,
      AccountId: account.id,
      IGAccountId: igaccount.id,
      photoUUID: photo.uuid
    }    


    await Post.create(props);

    await PostJob.initJobs2();

    const job = await PostJob.popJob();

    const body = await job.getDenormalizedBody();

    assert.deepEqual([ 'Photo', 'Account', 'IGAccount', 'Post' ],Object.keys(body));

  
  });

  it('should create jobs for all outstanding posts with .initJobs', async function(){


    const user = await ezUserAccount();
    const account = user.Accounts[0];
    const igaccount = await newIGAccount(user);
    const photo = await Photo.create({});

    const props = {
      postDate: sequelize.fn('NOW'),
      UserId: user.id,
      AccountId: account.id,
      IGAccountId: igaccount.id,
      photoUUID: photo.uuid
    }    


    await Post.bulkCreate(times(9,constant(props)));

    await PostJob.initPostJobs();

    //Run again to assure no dupes ;)

    await PostJob.initPostJobs();

    const jobs = await PostJob.findAll();

    assert.equal(9,jobs.length)


  });


  it('should find due posts with .due', async function(){


    const { post } = await createAccountUserPost();

    await post.initJob();

    const pd = await Post.due();

    assert(pd);

  });

  it ('should respond to reloadWithJob withJob with .Job object', async function(){
    const { post } = await createAccountUserPostJob();
    post.reloadWithJob();
    assert(post.PostJob);
  })



  it.skip('should respond to withUserForId with .User object', async function(){
    const { post } = await createAccountUserPostJob();

    let p = await Post.withUsersForId(post.id)
    assert(p.User);
  })

});
