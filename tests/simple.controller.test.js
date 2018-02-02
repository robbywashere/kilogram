
const { exprezz } = require('./helpers');

const dbSync = require('../db/sync');

const assert = require('assert');

const { User, Post, Photo, IGAccount }  = require('../objects');

const PostCntrl = require('../controllers/post');

const request = require('supertest');

const uuidv4 = require('uuid/v4');

const express = require('express');

describe('simple controller', function(){

  beforeEach(()=>dbSync(true))

  it ('should work', async function(){

    const igaccount = await IGAccount.create();

    const photo = await Photo.create({
      uuid: uuidv4(),
      objectName: 'blah',
      bucket:'blah'
    })

    const user2 = await User.create({ 
      email: 'x2@x.com',
      password: 'xxx'
    });


    await user2.reloadWithAccounts();

    const post2 = await Post.create({
      photoUUID: photo.uuid,
      postDate: new Date(),
      IGAccountId: igaccount.id,
      AccountId: user2.Accounts[0].id
    
    })

    const user = await User.create({ 
      email: 'x@x.com',
      password: 'xxx'
    });

    await user.reloadWithAccounts();

    const app = exprezz(user2);

    

    app.use('/post',PostCntrl())

    app.use(function(err,req, res, next){
      console.log(err.message)
      if (err.name === 'SequelizeValidationError') {
        res.status(400).send({ error: err.message })
      } else {
        res.status(err.code).send({ err })
      }
    })

   const res= await request(app)
      .post('/post/new')
      .send({
        photoUUID: photo.uuid,
        postDate: new Date(),
        AccountId: user.Accounts[0].id,
        IGAccountId: igaccount.id
      })
      .expect(200)

    console.log(res.body)

    const { id } = res.body;

    const res2 = await request(app)
      .get('/post')

    console.log(res2.body)
      



  })

})
