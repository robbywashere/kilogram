// TODO:  This logic should likely be converted to a python job queue runner
// The questions is if the data should be denormalized in the function or normalized prior
// to the function?
// for now ... each Job should have a withDeps' which loads all Dependencies to execute said job - this comes down to a Join Statement which would have to replicated in python without the help of sequelize ORM -
// Being that 'Jobs' are essentially ephmemeral the best case executing immediently in the case of passing this off to Python, perhaps the data should be denormalized and stored as JSON inside the table
//
const demand = require('../lib/demand');

const minio = require('../server-lib/minio');

const { get } = require('lodash');


async function PostJobRun({
  job = demand('job'),
  IGAccount = demand('IGAccount'),
  Post = demand('Post'),
  // Photo = demand('Photo')- I wish for a flatter dep injection :(
  agent = demand('agent'),
  minioClient = (new minio.MClient()),
}) {
  // TODO: I wish for a flatter dep injection :(
  if (typeof get(Post, 'Photo.objectName') === 'undefined') throw new Error(`Post ${Post.id} does not have a .Photo.objectName`);

  const localfile = await minioClient.pullPhoto({ name: Post.Photo.objectName });

  const result = await agent.exec({
    cmd: 'full_dance',
    args: {
      username: IGAccount.username,
      password: IGAccount.password,
      desc: Post.text,
      localfile,
    },
  });

  if (result.success) {
    return job.complete();
  }

  if (get(result, 'body.type') === 'creds_error') {
    return Promise.all([job.fail(), IGAccount.fail()]);
  }
  return job.retryTimes({ max: 3, body: result.body });
}


async function VerifyIGJobRun({
  job = demand('job'),
  IGAccount = demand('IGAccount'),
  agent = demand('agent'),
}) {
  const result = await agent.exec({
    cmd: 'verify_ig_dance',
    args: {
      username: IGAccount.username,
      password: IGAccount.password,
    },
  });
  if (result.success) { 
    const body = get(result,'body',{});
    if (body.login === true) {
     return Promise.all([job.complete(), IGAccount.good()]);
    }
    if (body.login === false && body.type === 'creds_error') {
      return Promise.all([job.complete(), IGAccount.fail()]);
    }
  }
  return job.retryTimes({ max: 3, body: result.body });
}


module.exports = { PostJobRun, VerifyIGJobRun };
