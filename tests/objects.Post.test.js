

process.env.NODE_ENV = 'test'; // TODO ?
const { Job, Post, Photo, User } = require('../objects');

const sinon = require('sinon');
const assert = require('assert');
const sequelize = require('sequelize');
const sync = require('../db/sync');
const Promise = require('bluebird');
const { createUserPostJob } = require('./helpers');
const { constant, times } = require('lodash');

describe('objects/Post', function(){

  beforeEach(async ()=> {
    return await sync(true);
  });

  it('should create jobs for all outstanding posts with .initJobs', async function(){


    const user = await User.create();
    const props = {
      postDate: sequelize.fn('NOW'),
      UserId: user.id,
      Photo: {
        bucket: 'uploads',
        extension: 'jpg'
      }
    }    
      
    await Post.bulkCreate(times(9,constant(props)),{
      include: [ Photo ]
    })

    await Post.initJobs();

    //Run again to assure no dupes ;)

    await Post.initJobs();

    const jobs = await Job.findAll();

    assert.equal(9,jobs.length)


  });


  it('should find due posts with .due', async function(){

    const user = await User.create();
    let post = await Post.create({
      postDate: sequelize.fn('NOW'),
      UserId: user.id,
      Photo: {
        bucket: 'uploads',
        extension: 'jpg'
      }
    },{
      include: [ Photo ]
    })


    await post.initJob();

    const pd = await Post.due();
    assert(pd);

  });

  it ('should respond to reloadWithJob withJob with .Job object', async function(){
    const post = await createUserPostJob();
    post.reloadWithJob();
    assert(post.Job);
  })



  it ('should respond to withUserForId with .User object', async function(){
    const post = await createUserPostJob();

    let p = await Post.withUserForId(post.id)
    assert(p.User);
  })

});
