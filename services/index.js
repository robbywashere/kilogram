// TODO:  This logic should likely be converted to a python job queue runner
// The questions is if the data should be denormalized in the function or normalized prior
// to the function?
// for now ... each Job should have a withDeps' which loads all Dependencies to execute said job - this comes down to a Join Statement which would have to replicated in python without the help of sequelize ORM -
// Being that 'Jobs' are essentially ephmemeral the best case executing immediently in the case of passing this off to Python, perhaps the data should be denormalized and stored as JSON inside the table
//
const demand = require('../lib/demand');
const demandKeys = require('../lib/demandKeys');
const minio = require('../server-lib/minio');
const { get, chain, isUndefined } = require('lodash');
const { logger } = require('../lib/logger');
const requestAsync = require('request-promise');
const request = require('request');


async function PostJobRun({
  job = demand('job'),
  IGAccount = demand('IGAccount'),
  Post = demand('Post'),
  agent = demand('agent'),
  minioClient,
}) {
  const mc = (typeof minioClient !== 'undefined') ? minioClient : (new minio.MClient());

  demandKeys(Post.Photo,['uuid','objectName','bucket'],' Post.Photo')

  const localfile = await mc.pullPhoto({ name: Post.Photo.objectName });

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
    const body = get(result, 'body', {});
    if (body.login === true) {
      return Promise.all([job.complete(), IGAccount.good()]);
    }
    if (body.login === false && body.type === 'creds_error') {
      return Promise.all([job.complete(), IGAccount.fail()]);
    }
  }
  return job.retryTimes({ max: 3, body: result.body });
}


//TODO: change the return types of these functions to match
//consider using event emitter or async generator
//must also consider how these jobs will be ran concurrently 
async function DownloadIGAvaJobRun({
  job = demand('job'),
  IGAccount = demand('IGAccount'),
  minioClient,
  retry = 3,
  reqAsync = requestAsync,
  reqPipe = request,
}) {
  const body = {};

  const result = await (async ()=>  {
    try {
      const html = await reqAsync.get(`https://www.instagram.com/${IGAccount.username}`);

      body.avatar = html.match(/"og:image".+?content="(.+)"/)[1];

      if (!body.avatar) {
        body.html = html;
        throw new Error('could not locate IG Avatar in body html');
      }

      const mc = (typeof minioClient !== 'undefined') ? minioClient : (new minio.MClientPublic());

      const { url, objectName, uuid } = await mc.newPhoto({ 
        AccountId: IGAccount.AccountId, 
        IGAccountId: IGAccount.id,
        type: 'IGAVATAR'
      });

      body.uuid = uuid;
      body.minioUrl = url;

      await new Promise((rs, rx) => reqPipe.get(body.avatar).pipe(reqPipe.put(url))
        .on('finish', rs)
        .on('error', rx));
    } catch(e) {
      body.error = e;
      return { success: false, body }
    }
    return { success: true, body }
  })();


  if (result.success) {

    return Promise.all([IGAccount.update({ avatarUUID: result.body.uuid }), job.complete()]);
  } 

  return job.retryTimes({ max: 3, body: result.body });
}

module.exports = { PostJobRun, DownloadIGAvaJobRun, VerifyIGJobRun };
