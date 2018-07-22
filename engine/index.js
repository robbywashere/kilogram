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
const EventEmitter = require('../lib/eventEmitter');


function RunWithDevice({
  task = demand('task'),
  events = demand('events'),
  model = demand('model'),
  nodeName = demand('nodeName'),
  minioClient = demand('minioClient'),
}) {
  return async () => {
    let device;
    let job;
    if ((device = await Device.popNodeDevice(nodeName)) && (job = await model.popJob())) {
      const agent = new DeviceAgent.Agent({ deviceId: device.adbId });

      await task({
        ...job,
        jobName: model.name,
        jobId: job.id,
        agent,
        events,
        minioClient,
      });
    }
    if (device) await device.setFree();
  };
}

function Run({
  events = demand('events'),
  task = demand('task'),
  model = demand('model'),
  minioClient = demand('minioClient'),
}) {
  return async () => {
    let job;
    if (!(job = await model.popJob())) return;

    return task({
      ...job,
      jobName: model.name,
      jobId: job.id,
      events,
      minioClient,
    });
  };
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

function EventRegister(events) {
  return function event(name, func) {
    events.on(name, async (body = {}) => {
      try {
        await func(body);
      } catch (e) {
        events.emit('eventError', {
          name, jobName: body.jobName, jobId: body.jobId, error: e,
        });
        // TODO: retry func X times?
      }
    });
  };
}

function EngineEvents(events = new EventEmitter()) {
  const eventr = EventRegister(events);

  eventr('IGAccount:downloadIGAva', ({ id, uuid }) => IGAccount.avatar(id, uuid));

  eventr('IGAcccount:fail', ({ id }) => IGAccount.fail(id));

  eventr('IGAccount:good', ({ id }) => IGAccount.good(id));

  eventr('Post:published', ({ id }) => Post.setPublished(id));

  eventr('job:complete', ({ jobId, jobName }) => objects[jobName].complete(jobId));

  eventr('job:error', ({
    error, body, jobId, jobName,
  }) => objects[jobName].fail(jobId));

  return events;
}


function VerifyIGSprocket({
  nodeName, events, minioClient, concurrent, debounce,
}) {
  const fn = RunWithDevice({
    model: VerifyIGJob,
    task: Tasks.verifyIG,
    nodeName,
    minioClient,
    events,
  });
  return Spinner.create({ fn, concurrent, debounce });
}


function PostSprocket({
  nodeName, events, minioClient, concurrent, debounce,
}) {
  const fn = RunWithDevice({
    model: PostJob,
    task: Tasks.post,
    nodeName,
    minioClient,
    events,
  });
  return Spinner.create({ fn, concurrent, debounce });
}

function SendEmailSprocket({
  nodeName, events, minioClient, concurrent, debounce,
}) {
  const fn = Run({
    model: SendEmailJob,
    task: Tasks.sendEmail,
    minioClient: {},
    events,
  });
  return Spinner.create({ fn, concurrent, debounce });
}

function DownloadAvaSprocket({
  nodeName, events, minioClient, concurrent, debounce,
}) {
  const fn = Run({
    model: DownloadIGAvaJob,
    task: Tasks.downloadIGAva,
    minioClient,
    events,
  });
  return Spinner.create({ fn, concurrent, debounce });
}

function InitPostJobsSprocket({ concurrent, debounce }) {
  const fn = () => PostJob.initPostJobs();
  return Spinner.create({ fn, concurrent, debounce });
}


function SyncDeviceSprocket({ concurrent, debounce, nodeName }) {
  const fn = () => Device.syncDevices({ nodeName });
  return Spinner.create({ fn, concurrent, debounce });
}


const main = function ({
  nodeName = config.get('DEVICE_NODE_NAME'),
  minioClient = (new MClient()),
  debounce = 1000,
  events = EngineEvents(),
} = {}) {
  events.on('eventError', ({ name, jobName, jobId }) =>
    logger.critical(`Event handler from name: ${name}, emitted from job: ${jobName}, id ${jobId} failed`));

  events.on('error', err => logger.critical('uncaught error in engine event loop spinner', err));

  const concurrent = 3;

  const spinz = [
    VerifyIGSprocket({
      nodeName, events, minioClient, concurrent, debounce,
    }),
    PostSprocket({
      nodeName, events, minioClient, concurrent, debounce,
    }),
    SendEmailSprocket({
      nodeName, events, minioClient, concurrent, debounce,
    }),
    DownloadAvaSprocket({
      nodeName, events, minioClient, concurrent, debounce,
    }),
    SyncDeviceSprocket({ concurrent, nodeName, debounce }),
    InitPostJobsSprocket({ concurrent, nodeName, debounce }),
  ];

  spinz.forEach(z => z.on('reject', (error) => logger.error(error)));

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
  InitPostJobsSprocket,
  EventRegister,
};
