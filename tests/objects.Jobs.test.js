
process.env.NODE_ENV = 'test'; // TODO ?
const { Job, Post, Photo, User } = require('../objects');

const sinon = require('sinon');
const assert = require('assert');
const sync = require('../db/sync');
beforeEach(async ()=> {
  return sync(true);
});

describe('objects/Jobs', function(){

  describe('outstanding' ,function() {

    it ('should create job via .fromNewPost()', async function(){
    
      const user = await User.create({});
      const photo = await Photo.create({
        bucket: 'uploads',
        extension: 'jpg',
      })
      const post = await Post.create({ 
        postDate: new Date(), 
        UserId: user.id
      })

      const p = await Post.findById(post.id);
      console.log(p.toJSON());
    
    });

    it ('should getUploadedPhoto', async function(){


    });
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
  });




})
