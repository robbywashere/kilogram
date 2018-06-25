const cmds = require('../android/cmds');
const { PostJob, VerifyIGJob, Device, DownloadIGAvaJob } = require('../objects');
const config = require('config');
const { logger } = require('../lib/logger');
const demand = require('../lib/demand');
const Runner = require('../services');
const DeviceAgent = require('../android/deviceAgent');

const {
  get, isUndefined, zipObject, startCase, fromPairs, clone, isEqual,
} = require('lodash');

// TODO: create CriticalError type which crashes everything?
// TODO: safe logger?
// TODO: error handling is bonkers
// TODO: assure jobs run in priority order, by ids since incremental
// TODO: !!!Jobs are essentially state machines, and maybe should be implimented more clearly as such to assist in better logging and error handling

function logDiff(logFn = console.log) {
  let oldStatus = {};
  return (newStatus) => {
    if (!isEqual(oldStatus, newStatus)) {
      logFn(newStatus);
    }
    oldStatus = clone(newStatus);
  };
}


function logDeviceSync(result) {
  try {
    if (Object.entries(result).map(([k, v]) => v).some(v => v && v.length)) {
      logger.status(fromPairs(Object.entries(result).map(([k, v]) => [startCase(k), (v && v.length) ? v.join(',') : '*'])));
    }
  } catch (e) {
    try {
      logger.status(JSON.stringify(result, null, 4));
    } catch (e2) {
      logger.error('hoplessly unable to log device sync result');
    }
  }
}

// TODO: move me?
async function syncDevices() {
  const adbOnlineDevices = await cmds.adbDevices();
  await Device.freeDanglingByIds(adbOnlineDevices); // TODO:???
  await Device.syncAll(adbOnlineDevices).then(logDeviceSync);
}


const run = function (fn, milliseconds) { // Job 'Harness' - Errors should never reach this point?
  return setInterval(() => {
    fn().catch(e => logger.critical(`Unhandled exception in engine 'run' harness : ${fn.name}`, e));
  }, milliseconds);
};


function allJobsStats(stats = {}, freeDevices = []) {
  return {
    ...zipObject(Object.keys(stats).map(startCase), Object.values(stats)),
    'Free Devices': (freeDevices).length,
  };
}

function jobStats(job) {
  const associations = Object.keys(job.constructor.associations);
  return {
    ...associations.reduce((p, key) => {
      p[`${startCase(key)} Id`] = get(job, `${key}Id`); return p;
    }, {}),
  };
}

function runJob({
  JobModel = demand('JobModel'),
  jobRunner = demand('jobRunner'),
} = {}) {
  return async function () {
    let job;
    if (job = await JobModel.popJob()) {
      try {
        await job.denormalize();
        await jobRunner({ ...job, job });
      } catch (err) {
        await job.backout(err, true);
        logger.error(`-- Unexpected error occurred running ${JobModel.name}: ${job.id} \n ${err}`);
      }
    } 
  };
}

function runDeviceJob({
  nodeName = demand('nodeName'),
  JobModel = demand('JobModel'),
  jobRunner = demand('jobRunner'),
} = {}) {
  return async function () {
    let device;
    let job;
    if ((device = await Device.popNodeDevice(nodeName)) && (job = await JobModel.popJob())) {
      try {
        const deviceId = device.get('adbId');
        const agent = new DeviceAgent.Agent({ deviceId });
        await job.denormalize();
        await jobRunner({ ...job, agent, job });
      } catch (err) {
        await job.backout(err, true); // jobRunner should handle this?
        logger.error(`-- Unexpected error occurred running ${JobModel.name}: ${job.id} \n ${err}`);
      }
    } 
    if (device) await device.setFree();
  };
}


const main = function ({ 
  nodeName = (config.get('DEVICE_NODE_NAME') || demand('{ nodeName: <String> }')),
  interval = 1000
} = {}) {
  return [

    // this will run on a  master node 
    run(PostJob.initPostJobs, interval), // Turns posts into queued jobs


    //master node and or web node
    run(runJob({
      JobModel: DownloadIGAvaJob,
      jobRunner: Runner.DownloadIGAvaJobRun,
    }), interval),

    // These will run on a device node
   
    run(syncDevices, interval),

    run(runDeviceJob({
      nodeName,
      JobModel: PostJob,
      jobRunner: Runner.PostJobRun,
    }), interval),

    run(runDeviceJob({
      nodeName, 
      JobModel: VerifyIGJob, 
      jobRunner: Runner.VerifyIGJobRun,
    }), interval),
  ];
};

module.exports = {
  runDeviceJob, run, main, syncDevices,
};
