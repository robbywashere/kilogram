

const { Account, IGAccount, Job, Post, Photo, User } = require('../../objects');

const sinon = require('sinon');
const assert = require('assert');
const sequelize = require('sequelize');
const sync = require('../../db/sync');
const Promise = require('bluebird');
const { ezUser, newIGAccount, ezUserAccount, createUserPostJob, createAccountUserPost, createAccountUserPostJob  } = require('../helpers');
const { constant, times } = require('lodash');
const minioObj = require('../../server-lib/minio/minioObject');

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

    await Job.initJobs();

    //Run again to assure no dupes ;)

    await Job.initJobs();

    const jobs = await Job.findAll();

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
    assert(post.Job);
  })



  it.skip('should respond to withUserForId with .User object', async function(){
    const { post } = await createAccountUserPostJob();

    let p = await Post.withUsersForId(post.id)
    assert(p.User);
  })

});