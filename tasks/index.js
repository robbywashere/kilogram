const demand = require('../lib/demand');
const demandKeys = require('../lib/demandKeys');
const minio = require('../server-lib/minio');
const { get, chain, isUndefined } = require('lodash');
const { logger } = require('../lib/logger');
const requestAsync = require('request-promise');
const request = require('request');
const Emailer = require('../server-lib/emailer');
const { Photo, DownloadIGAva, Device } = require('../objects');
const DeviceAgent = require('../android/deviceAgent');

async function downloadIGAva({
  events = demand('events'),
  minioClient = demand('minioClient'),
  IGAccount = demand('IGAccount'),
  jobId = demand('jobId'),
  jobName = demand('jobName'),
  reqAsync = requestAsync,
  reqPipe = request,
}) {
  const body = {};

  try {
    const html = await reqAsync.get(`https://www.instagram.com/${IGAccount.username}`);

    body.avatar = html.match(/"og:image".+?content="(.+)"/)[1];

    if (!body.avatar) {
      body.html = html;
      throw new Error('could not locate IG Avatar in body html');
    }

    //    const mc = (typeof minioClient !== 'undefined') ? minioClient : (new minio.MClientPublic());

    const { url, objectName, uuid } = await minioClient.newPhoto({
      AccountId: IGAccount.AccountId,
      IGAccountId: IGAccount.id,
      type: 'IGAVATAR',
    });

    body.uuid = uuid;

    body.minioUrl = url;

    await new Promise((rs, rx) => reqPipe.get(body.avatar).pipe(reqPipe.put(url)).on('finish', rs).on('error', rx));

    events.emit('ig_avatar:downloaded', { id: IGAccount.id, jobId });
    events.emit('job:complete',{ jobId, jobName })
  } catch (error) {
    try { await Photo.destroy({ where: { uuid: body.uuid }}) } catch(e){ /* :shrug: */};
    events.emit('job:error', { error, body, jobId, jobName });
  }

  //   return Promise.all([IGAccount.update({ avatarUUID: result.body.uuid }), job.complete()]);
}

async function sendEmail({
  events = demand('events'),
  jobId = demand('jobId'),
  jobName = demand('jobName'),
  reqAsync = requestAsync,
  reqPipe = request,
  email: {
    to, from, msg: message, subject, //demand?
  },
}) {
  try {

    //Agent
    const emailer = new Emailer({ });
    await emailer.send({
      to, from, msg: message, subject,
    });
    //end
    events.emit('job:complete',{ jobId, jobName })
  } catch (error) {
    events.emit('job:error',{ jobId, jobName, error, body: {} })
    //body.error = err;
    // return { success: false, body, error: err };
  }
}


async function verifyIG({ // emit
  events = demand('events'),
  jobId = demand('jobId'),
  jobName = demand('jobName'),
  agent = demand('agent'),
  IGAccount = demand('IGAccount'),
}) {
  let body = {};
  try {

    //Agent
    const agentResult = await agent.exec({
      cmd: 'verify_ig_dance',
      args: {
        username: IGAccount.username,
        password: IGAccount.password,
      },
    });
    //end

    body = get(agentResult, 'body', {});
    // Positive result
    if (body.login === true) {
      events.emit('ig_account:verified', { id: IGAccount.id });
      // events.emit('ig_account_success',{ id: IGAccountId })
      // await IGAccount.good();
      // return { success: true, body }
    }
    // Negative result
    if (body.login === false && body.type === 'creds_error') {
      events.emit('ig_account:failed', { IGAccountId: IGAccount.id });
      // await IGAccount.fail();
      //   return { success: true, body };
    }
    events.emit('job:complete',{ jobId, jobName })
  } catch (error) {
    events.emit('job:error', { error, body, jobId, jobName });
    // return { success: false, body: {}, error: err };
  }
}

async function post({
  minioClient = demand('minioClient'),
  events = demand('events'),
  jobId = demand('jobId'),
  jobName = demand('jobName'),
  agent = demand('agent'),
  IGAccount = demand('IGAccount'),
  Post = demand('Post'),
}) {
  let agentResult = {};
  let body = {};

  try {

    //agent
    const localfile = await minioClient.pullPhoto({ name: Post.Photo.objectName });
    agentResult = await agent.exec({
      cmd: 'full_dance',
      args: {
        username: IGAccount.username,
        password: IGAccount.password,
        desc: Post.text,
        localfile, // TODO: DELETE WHEN FIN
      },
    });
    //end

    body = get(agentResult, 'body', {});

    if (agentResult.success) {
      events.emit('post:published', { id: Post.id, jobId });
      // await Post.setPublished(); // IF this fails , post will be re-done?!
    }

    if (get(agentResult, 'body.type') === 'creds_error') { 
      events.emit('ig_account:failed', { id: IGAccount.id, jobId, body });
      //     await IGAccount.fail();
    }
    events.emit('job:complete',{ jobId, jobName })
  } catch (error) {
    events.emit('job:error', { error, body, jobId, jobName });
  }
}


module.exports = {
  post,
  downloadIGAva,
  verifyIG,
  sendEmail,
};
