const assert = require('assert');

const { loadObjectControllers } = require('../../controllers');

const PostController = require('../../controllers/post');

const DB = require('../../db');

const {
  exprezz, request, ezUser,  newIGAccount,
} = require('../helpers');

const dbSync = require('../../db/sync');

const {
  User, Photo, IGAccount, Account, Post,
} = require('../../models');

const minioObj = require('../../server-lib/minio/minioObject');

describe('Post Controller', () => {
  beforeEach(() => dbSync(true));

  it('Should not only allow post creation for users not member of Account and subsequent IGAccount', async () => {
    const user = await ezUser(
      { Accounts: {} },
      {
        include: [Account],
      },
    );

    const badUser = await ezUser(
      {
        email: 'badUser@baduser.com',
        Accounts: {},
      },
      {
        include: [Account],
      },
    );

    const igAccount = await newIGAccount(user);

    const photo = await Photo.createPostPhoto();

    const app = exprezz(badUser);

    app.use(PostController());

    const res = await request(app)
      .post('/')
      .send({
        AccountId: user.Accounts[0].id,
        postDate: new Date(),
        IGAccountId: igAccount.id,
        photoUUID: photo.uuid,
      })
      .expect(403);
  });

  it('Should only allow post creation for users of member of Account and IGAccount', async () => {
    const user = await ezUser(
      { Accounts: {} },
      {
        include: [Account],
      },
    );

    const igAccount = await newIGAccount(user);

    const photo = await Photo.createPostPhoto();

    const app = exprezz(user);

    app.use(PostController());

    const res = await request(app)
      .post('/')
      .send({
        AccountId: user.Accounts[0].id,
        postDate: new Date(),
        IGAccountId: igAccount.id,
        photoUUID: photo.uuid,
      })
      .expect(200);
  });
});
