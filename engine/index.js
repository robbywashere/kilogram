const objects = require('../objects');

const {
  Post, IGAccount, PostJob, VerifyIGJob, Device, SendEmailJob, DownloadIGAvaJob,
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
  return () => {
    let device;
    let job;
    if ((device = await Device.popNodeDevice(nodeName)) && (job = await model.popJob())) {
      const agent = new DeviceAgent.Agent({ deviceId: device.adbId });
      return JobRun({
        events, job, minioClient, agent, task, model,
      });
    }
    if (device) return device.setFree();
  }
}

async function Run({
  events = demand('events'),
  task = demand('task'),
  model = demand('model'),
  minioClient = demand('minioClient'),
}) {
  return ()=> {
    let job;
    if (!(job = await model.popJob())) return;
    return JobRun({
      events, task, job, minioClient, model,
    });
  }
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

function EngineEvents() {
  const events = new EventEmitter();

  function event(name, func) {
    events.on(name, async (body) => {
      try {
        await func(body);
      } catch (e) {
        //     logger.critical(`Event ${name} emitted from job: ${body.jobName}, id ${body.jobId} failed`);
        events.emit('error', { name, jobName: body.jobName, jobId: body.jobId });
        // TODO: retry func X times?
      }
    });
  }

  event('IGAccount:downloadIGAva', ({ id, uuid }) => IGAccount.avatar(id, uuid));

  event('IGAcccount:fail', ({ id }) => IGAccount.fail(id));

  event('IGAccount:good', ({ id }) => IGAccount.good(id));

  event('Post:published', ({ id }) => Post.setPublished(id));

  event('job:complete', ({ jobId, jobName }) => objects[jobName].complete(jobId));

  event('job:error', ({
    error, body, jobId, jobName,
  }) => objects[jobName].fail(jobId));

  return events;
}


function VerifyIGSprocket({ nodeName, events, minioClient, concurrent, debounce }){ 
  const fn = RunWithDevice({
    model: VerifyIGJob,
    task: Tasks.verifyIG,
    nodeName,
    minioClient,
    events,
  });
  return Spinner.create({ fn, concurrent, debounce });
}


function PostSprocket({ nodeName, events, minioClient, concurrent, debounce }) {
  const fn = RunWithDevice({
    model: PostJob,
    task: Tasks.post,
    nodeName,
    minioClient,
    events,
  });
  return Spinner.create({ fn, concurrent, debounce });
}

function SendEmailSprocket({ nodeName, events, minioClient, concurrent, debounce }) {
  const fn = Run({
    model: SendEmailJob,
    task: Tasks.sendEmail,
    minioClient: {},
    events,
  });
  return Spinner.create({ fn, concurrent, debounce });
}

function DownloadAvaSprocket({ nodeName, events, minioClient, concurrent, debounce }) {
  const fn = Run({
    model: DownloadIGAvaJob,
    task: Tasks.downloadIGAva,
    minioClient,
    events,
  });
  return Spinner.create({ fn, concurrent, debounce });
}

function SyncDeviceSprocket(){
  const fn = Device.syncDevices.bind(Device);
  return Spinner.create({ fn, concurrent, debounce });
}


const main = function ({
  nodeName = config.get('DEVICE_NODE_NAME'),
  minioClient = (new MClient()),
  debounce = 1000,
  events = EngineEvents();
} = {}) {

  events.on('error', ({ name, jobName, jobId }) =>
    logger.critical(`Event handler from name: ${name}, emitted from job: ${jobName}, id ${jobId} failed`));

  const concurrent = 3;

  const spinz = [
    VerifyIGSprocket({ nodeName, events, minioClient, concurrent, debounce }),
    PostSprocket({ nodeName, events, minioClient, concurrent, debounce }),
    SendEmailSprocket({ nodeName, events, minioClient, concurrent, debounce }),
    DownloadAvaSprocket({ nodeName, events, minioClient, concurrent, debounce }), 
    SyncDeviceSprocket(),
  ]

  return () => spinz.forEach(z => z.stop());
};

module.exports = {
  main,
  EngineEvents,
  VerifyIGSprocket,
  PostSprocket,
  SendEmailSprocket,
  DownloadAvaSprocket,
  SyncDeviceSprocket,
};
