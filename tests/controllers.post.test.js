

const assert = require('assert');

const { loadObjectControllers, } = require('../controllers');

const DB = require('../db');

const { exprezz, ezUser } = require('./helpers');

const dbSync = require('../db/sync');

const request = require('supertest');

const { User, Photo, IGAccount, Account, Post } = require('../objects');

const minioObj = require('../server-lib/minio/minioObject');

describe.only('Post Controller', function(){
  beforeEach(()=>dbSync(true))

  it('Should not only allow post creation for users not memeber of Account and IGAccount',async function(){



    const user = await User.create({ superAdmin: false, password: 'x', email: 'x@x.com', Accounts: { } }, { include: [ Account ] })

    const igAccount1 = await IGAccount.create();
    const igAccount2 = await IGAccount.create();

    const objectName = minioObj.create('v4',{ uuid: 'UUID', accountId: user.Accounts[0].id });

    const photo = await Photo.create({ objectName, bucket: 'uploads' });

    const photoUUID = photo.uuid;

    //await user.accounts[0].addigaccount(igaccount1);
    // await user.accounts[0].addigaccount(igaccount2);

    await user.reloadWithAccounts(); 

    const app = exprezz(user);

    loadObjectControllers({ app, sequelize: DB, objects: { Post }})

    console.log(await Post.findAll().map(p=>p.toJSON()))

    const AccountId = user.Accounts[0].id
    const IGAccountId = igAccount1.id;
    const UserId = user.id;
    const postDate = new Date();
    const text = 'blah';
    const res = await request(app)
      .post('/posts')
      .send({ AccountId, postDate, text, IGAccountId, UserId, objectName, photoUUID })
      .expect(403)


    const posts = await Post.findAll();

    assert(!posts.length);

  })

  it.only('Should only allow post creation for users not memeber of Account and IGAccount',async function(){


    const user = await User.create({ superAdmin: false, password: 'x', email: 'x@x.com', Accounts: { } }, { include: [ Account ] })

    const objectName = minioObj.create('v4',{ uuid: 'UUID', accountId: 1 });

    const photo = await Photo.create({ objectName, bucket: 'uploads' });

    const igAccount1 = await IGAccount.create();
    const igAccount2 = await IGAccount.create();

    await user.Accounts[0].addIGAccount(igAccount1);

    await user.reloadWithAccounts(); 

    const app = exprezz(user);

    loadObjectControllers({ app, sequelize: DB, objects: { Post }})



    const AccountId = user.Accounts[0].id
    const IGAccountId = igAccount1.id;
    const UserId = user.id;
    const postDate = new Date();
    const text = 'blah';
    const res = await request(app)
      .post('/posts')
      .send({ AccountId, postDate, text, IGAccountId, photoUUID: photo.uuid })
      .expect(201)

    const post = await Post.findById(1,{ include: [ Photo ] })
    console.log(post.Photo.get('meta'));
  })
})
