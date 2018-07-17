const objects = require('../objects');
const {
  IGAccount, PostJob, VerifyIGJob, Device, SendEmailJob, DownloadIGAvaJob,
} = objects; 

const config = require('config');
const { logger } = require('../lib/logger');
const demand = require('../lib/demand');
const Tasks = require('../tasks');
const MClient = require('../server-lib/minio');
const Spinner = require('./spinner');

const DeviceAgent = require('../android/deviceAgent');
const { EventEmitter } = require('events');


async function RunWithDevice({
  task = demand('task'),
  events = demand('events'),
  model = demand('model'),
  nodeName = demand('nodeName'),
  minioClient = demand('minioClient'),
}) {
  let device;
  let job;
  if ((device = await Device.popNodeDevice(nodeName)) && (job = await model.popJob())) {
    const agent = new DeviceAgent.Agent({ deviceId: device.adbId });
    return JobRun({
      events, job, minioClient, agent, task, model,
    });
  } else if (device) {
    if (device) return device.setFree();
  }
}

async function Run({
  events = demand('events'),
  task = demand('task'),
  model = demand('model'),
  minioClient = demand('minioClient'),
}) {
  let job;
  if (!(job = await model.popJob())) return;
  return JobRun({
    events, task, job, minioClient, model,
  });
}


function JobRun({
  events = demand('events'),
  job = demand('job'),
  task = demand('task'),
  model = demand('model'),
  minioClient = demand('minioClient'),
  agent,
}) {
  return task({
    ...job,
    jobName: model.name,
    jobId: job.Id,
    events,
    agent,
    minioClient,
  });
}

/*
function runJob({
  JobModel = demand('JobModel'),
  jobTasks = demand('jobTasks'),
} = {}) {
  return async function () {
    let job;
    if (job = await JobModel.popJob()) {
      try {
        await job.denormalize();
        await jobTasks({ ...job, job });
      } catch (err) {
        await job.backout(err, true);
        logger.error(`-- Unexpected error occurred running ${JobModel.name}: ${job.id}`);
        logger.error(err);
      }
    }
  };
} */


const main = function ({
  nodeName = config.get('DEVICE_NODE_NAME'),
  minioClient = (new MClient()),
  interval = 1000,
} = {}) {

  const events = new EventEmitter();

  const event(name, func) {

    events.on(name, async (body) => { 
      try {
        await func(body);
      } catch(e) {
        logger.critical(`Event ${name} emitted from job: ${body.jobName}, id ${body.jobId} failed`)
        //TODO: retry func X times, then shutdown server? - db is offline etc?
      }
    });
  }

  event('IGAccount:downloadIGAva', ({ id, uuid }) => IGAccount.avatar(id,uuid));

  event('IGAcccount:fail', ({ id }) => IGAccount.fail(id));

  event('IGAccount:good', ({ id }) => IGAccount.good(id));

  event('Post:published', ({ id }) => Post.setPublished(id));

  event('job:complete', ({ jobId, jobName }) => objects[jobName].complete(jobId));

  event('job:error', ({ error, body, jobId, jobName }) => objects[jobName].fail(jobId));


  const verifyIg = () => RunWithDevice({
    model: VerifyIGJob,
    task: Tasks.verifyIG,
    nodeName,
    minioClient,
    events,
  });

  const post = () => RunWithDevice({
    model: PostJob,
    task: Tasks.post,
    nodeName,
    minioClient,
    events,
  });

  const sendEmail = () => Run({
    model: SendEmailJob,
    task: Tasks.sendEmail,
    minioClient: {},
    events,
  });

  const downloadAva = () => Run({
    model: DownloadIGAvaJob,
    task: Tasks.downloadIGAva,
    minioClient,
    events,
  });

  const deviceSync = Device.syncDevices.bind(Device);
};

module.exports = {
  runDeviceJob, run, main,
};
