const { readdirSync, readFileSync } = require('fs');
const { exec, spawn } = require('child_process');
const { Readable } = require('stream');
const { logger } = require('../../lib/logger');
const {
  User, PostJob, Photo, Account, IGAccount, Post, Device,
} = require('../../objects');
const rimraf = require('rimraf');
const minioObj = require('../../server-lib/minio/minioObject');
const { get } = require('lodash');

function loadFixture(name) {
  return readFileSync(`${__dirname}/../fixtures/${name}`).toString();
}

function fixtures() {
  const fixies = readdirSync(`${__dirname}/../fixtures`);
  const o = {};
  fixies.forEach(f => o[f] = loadFixture(f));
  return o;
}

function appLogger(app) {
  app.use((err, req, res, next) => {
    console.error('>>> express logger', err);
    res.status(err.statusCode || 500)
      .send(err.msg || err.toString());
    throw err;
  });
}

function fakeReadStream(string = 'fakeReadStream()') {
  const s = new Readable();
  s._read = function noop() {};
  s.push(string);
  s.push(null);
}

const deviceFactory = (n, nodeName = 'HOME1') => Device.create({
  adbId: `adbId${n}`,
  idle: true,
  online: true,
  enabled: true,
  nodeName,
});

function runMinio({ log = true, testDir = './.minio-test-data' } = {}) {
  const stderr = [];
  const minio = spawn('minio', ['server', testDir]);
  minio.stdout.on('data', (data) => {
    minio.emit('data', data);
    if (log) process.stdout.write(`minio stdout: ${data}`);
  });

  minio.stderr.on('data', (data) => {
    stderr.push(data);
    if (log) process.stderr.write(`minio stderr: ${data}`);
  });

  minio.once('data', () => minio.emit('open', {}));

  minio.on('close', (code) => {
    process.stdout.write(`child process exited with code ${code}`);
  });
  return minio;
}


function exprezz(user = {}) {
  const app = require('express')();
  app.use(require('body-parser').json());
  app.all('*', (req, res, next) => {
    req.user = user;
    next();
  });
  return app;
}

async function initJob({ id, AccountId, IGAccountId }) {
  try {
    return await PostJob.create({
      PostId: id,
      AccountId,
      IGAccountId,
    });
  } catch (error) {
    if (get(error, 'errors[0].type') === 'unique violation') {
      logger.error(`'PostJob' already exists for PostId: ${this.id}`);
    } else {
      throw error;
    }
  }
}

function newIGAccount(user) {
  return IGAccount.create({ username: 'username', password: 'password', AccountId: user.Accounts[0].id });
}

async function createUserAccountIGAccountPhotoPost(userOpts) {
  const user = await User.create({
    password: 'blah',
    email: 'test@test.com',
    ...userOpts,
    Accounts: {},
  }, { include: [Account] });
  const account = user.Accounts[0];
  const igAccount = await newIGAccount(user);

  const photo = await Photo.createPostPhoto();

  const post = await createPhotoPost({
    user, account, igAccount, postOpts: { description: '#description' },
  });


  return {
    account, igAccount, user, post, photo,
  };
}


async function createAccountUserPostJob() {
  const user = await User.create({
    password: 'blah',
    email: 'test@test.com',
    Accounts: {},
  }, { include: [Account] });
  const account = user.Accounts[0];
  const photo = await Photo.createPostPhoto({});
  const igAccount = await newIGAccount(user);
  const post = await Post.create({
    postDate: new Date(),
    UserId: user.id,
    AccountId: account.id,
    IGAccountId: igAccount.id,
    text: '#description',
    photoUUID: photo.uuid,
    Photo: photo,
  });

  await initJob(post);
  await post.reloadWithJob();

  return {
    account, igAccount, user, post, job: post.PostJob,
  };
}

function ezUser(opts, moreOpts) {
  return User.create(Object.assign({
    password: 'blah',
    email: 'test@test.com',
  }, opts), moreOpts);
}

function ezUserAccount(opts) {
  return ezUser({ ...opts, Accounts: {} }, { include: [Account] });
}

async function createAccountUserPost(userOpts) {
  const user = await ezUserAccount(userOpts);
  const photo = await Photo.createPostPhoto({});
  const account = user.Accounts[0];
  const igAccount = await newIGAccount(user);
  const post = await Post.create({
    postDate: new Date(),
    UserId: user.id,
    AccountId: account.id,
    IGAccountId: igAccount.id,
    photoUUID: photo.uuid,
    PhotoId: photo.id,
  });
  return {
    account, igAccount, user, post,
  };
}
function createPhotoPost({
  account, igAccount, user, postOpts = {}, photoOpts = {},
}) {
  return Post.create({
    postDate: new Date(),
    AccountId: account.id,
    IGAccountId: igAccount.id,
    UserId: user.id,
    ...postOpts,
    Photo: {
      bucket: 'uploads',
      type: 'POST',
      ...photoOpts,
    },
  }, {
    include: [Photo],
  });
}

async function createAccountUserPostJob2() {
  const user = await ezUserAccount();
  const account = user.Accounts[0];
  const igAccount = await newIGAccount(user);
  const post = await createPhotoPost({ account, igAccount, user });
  await initJob(post);
  await post.reloadWithJob();

  return post;
}

async function createUserPostJob() {
  const user = await ezUserAccount();
  const post = await createPhotoPost({ user });
  await initJob(post);
  await post.reloadWithJob();

  return post;
}

async function createUserAccountIGAccount(opts) {
  const user = await ezUserAccount(opts);
  const account = user.Accounts[0];
  const igAccount = await newIGAccount(user);
  return { user, account, igAccount };
}

module.exports = {
  createUserAccountIGAccountPhotoPost,
  initJob,
  runMinio,
  ezUser,
  createUserAccountIGAccount,
  ezUserAccount,
  fixtures,
  createAccountUserPostJob,
  newIGAccount,
  createUserPostJob,
  createAccountUserPostJob,
  createAccountUserPost,
  exprezz,
  appLogger,
  fakeReadStream,
  deviceFactory,
};
