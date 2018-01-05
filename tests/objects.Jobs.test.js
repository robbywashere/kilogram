
process.env.NODE_ENV = 'test'; // TODO ?
const { Job, Post, Photo, User } = require('../objects');

const sinon = require('sinon');
const assert = require('assert');
const sync = require('../db/sync');
const Promise = require('bluebird');

describe('objects/Jobs', function(){

  beforeEach(async ()=> {
    return await sync(true);
  });

  it ('should respond to findByIdFull with job.Post, job.Post.Photo, job.User',async function(){

    const user = await User.create();
    let post = await Post.create({
      postDate: new Date(),
      UserId: user.id,
      Photo: {
        bucket: 'uploads',
        extension: 'jpg'
      }
    },{
      include: [ Photo ]
    }).then(p => p.reload({ include: [ Job ]}))

    const job = await Job.findByIdFull(post.Job.id);

    assert(job.Post);
    assert(job.Post.Photo);
    assert(job.User)
  })

  it('should .popJob - giving a single job returning a job from the db while updating that job as inprog: true', async function(){


    const user = await User.create();
    let post = await Post.create({
      postDate: new Date(),
      UserId: user.id,
      Photo: {
        bucket: 'uploads',
        extension: 'jpg'
      }
    },{
      include: [ Photo ]
    }).then(p => p.reload({ include: [ Job ]}))

    const job = await Job.findById(post.Job.id, { 
      include: [ { model: User }, { model: Post, include: [ { model: Photo } ] } ] 
    });

    const j = await Job.popJob();

    assert(j.inprog);

  })

  it('should include Post, User, and Post.Photo', async function(){

    const user = await User.create();
    let post = await Post.create({
      postDate: new Date(),
      UserId: user.id,
      Photo: {
        bucket: 'uploads',
        extension: 'jpg'
      }
    },{
      include: [ Photo ]
    }).then(p => p.reload({ include: [ Job ]}))

    const job = await Job.findById(post.Job.id, { 
      include: [ { model: User }, { model: Post, include: [ { model: Photo } ] } ] 
    });

    assert(job.Post);
    assert(job.Post.Photo);
    assert(job.User);


  })

  it ('should report outstanding jobs', async function(){
    const j = await Job.create({
      args: { arg1: 1 },
      cmd: 'cmd',
    })
    const jNot = await Job.create({
      args: { arg1: 1 },
      cmd: 'cmd',
      inprog: true,
      finish: false
    })

    const jNot2 = await Job.create({
      args: { arg1: 1 },
      cmd: 'cmd',
      inprog: false,
      finish: true
    })

    let jOut = await Job.outstanding();

    assert.equal(1, jOut.length)

    assert.equal(j.id, jOut[0].id)
  })




})
