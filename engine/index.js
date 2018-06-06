
const cmds = require('../android/cmds');
const { PostJob, VerifyIGJob, Device } = require('../objects');
const { logger } = require('../lib/logger');
const demand = require('../lib/demand');
const Runner = require('../android/python/runner');
const DeviceAgent = require('../android/python/deviceAgent');

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

async function syncDevices() {
  const devs = await cmds.adbDevices();
  await Device.freeDanglingByIds(devs); // TODO:???
  await Device.syncAll(devs).then(logDeviceSync);
}


const run = function (fn, milliseconds) { // Job 'Harness' - Errors should never reach this point?
  return setInterval(() => {
    fn().catch(e => logger.critical(`Unhandled exception in function: ${fn.name}`, e));
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


// TODO: Jobs may not always be device dependent! different function?
function runJobs({ JobModel = demand('JobModel'), JobRunner = demand('JobRunner') } = {}) {
  const diffLog1 = logDiff(logger.status);

  const diffLog2 = logDiff(logger.status);

  return async function () {
    let device;
    let job;
    try {
      const stats = await JobModel.stats();
      const freeDevices = await Device.free();

      diffLog1(allJobsStats(stats, freeDevices));

      if (stats.open > 0 && freeDevices.length > 0) {
        if ((device = await Device.popDevice()) && (job = await JobModel.popJob())) {
          try {
            const deviceId = device.get('adbId');
            const agent = new DeviceAgent.Agent({ deviceId });

            await job.denormalize(); // Loads Job data from Id's into 'job' object
            diffLog2(jobStats(job));

            const jobResult = await JobRunner({
              ...job,
              agent,
              job,
            });

            // TODO: this needs more robust handling!
            if (!get(jobResult, 'success')) throw new Error(jobResult.error);

            await job.complete({ body: jobResult });

            logger.status(`-- ${JobModel.name} Run cycle complete Job Id: ${job.id}, success: ${jobResult.success}`);
            logger.status('----- Result: ', (jobResult) || 'None');
          } catch (err) {
            // TRY if fails critical error?
            await job.backout(err); // TODO !!!: backing out of job puts job in sleep mode, retry? retry with count?
            logger.error(`-- Error running Job: ${job.id}`); // TODO: logger.status??
            throw err;
          }
        }
      }
    } catch (e) {
      logger.error(`Error running 'runJobs' in engine/index.js,\n${e}`);
      try { logger.error(JSON.stringify(e, null, 4)); } catch (e) {}
    } finally {
      if (device) {
        logger.status(`Freeing device-adbId: ${device.adbId}`);
        await device.setFree();
      }
      /* if (job && job.status === 'SPINNING') {
        await job.update({ status: 'OPEN' });
      } */
    }
  };
}


const main = function () {
  return [
    run(syncDevices, 1000),

    run(PostJob.initPostJobs, 1000), // Turns posts into queued jobs

    run(runJobs({ JobModel: PostJob, JobRunner: Runner.PostJobRun }), 2000),

    run(runJobs({ JobModel: VerifyIGJob, JobRunner: Runner.VerifyIGJobRun }), 2000),
  ];
};

module.exports = {
  runJobs, run, main, syncDevices,
};
