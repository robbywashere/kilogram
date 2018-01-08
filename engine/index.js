
const cmds = require('../android/cmds');
const { Job, Device } = require('../objects');
const { logger } = require('../lib/logger');
const runner = require('../python/runner');
const Promise = require('bluebird');

const syncDevices = async () => {
  const devs = await cmds.adbDevices();
  await Device.freeDanglingByIds(devs); //TODO:???
  const resultOfSync = await Device.syncAll(devs);
  logger.debug(resultOfSync);
};


const KillFn = ()=>{
  let toKill = false;
  return (kill)=> {
    if (kill) toKill = true;
    return toKill
  }
}

const run = async function({ fn, seconds, killFn=()=>{} }){
  for(;;) {
    if (killFn()) {
      const error = new Error(`Function ${fn.name} killed`)
      error.code = 666;
      throw error;
    }
    try {
      await fn();
    } catch(e) {
      logger.error(`Unhandled exception in function: ${fn.name}`,e)
    }
    await Promise.delay(seconds * 1000)
  }
}

//device.reload()
//if device.idle == false, free
//TODO: assure jobs are ran in priority order

const runJobs = async() => {
  //TODO: try catch block
  const outstanding = await Job.outstanding();
  const freeDevices = await Device.free();
  logger.debug({ freeDevices: freeDevices.length, outstandingJobs: outstanding.length })
  if (outstanding.length > 0 && freeDevices.length > 0) {
    const device = await Device.popDevice();

    if (device) {
      const job = await Job.popJob();
      if (job) {
        await job.reloadWithAll();
        const deviceId = device.get('adbId');
        const agent = new runner.Agent({ deviceId });
        logger.debug(`Running Job: ${job.id}, Post: ${job.Post.id} User: ${job.User.id}, Device: ${deviceId}:${device.id}`);
        await runner.JobRun({ post: job.Post, agent, job: job, user: job.User, photo: job.Post.Photo })
      }
      await device.setFree();
    }
  }
}

const mainLoop= () => {
  run(syncDevices,2);
  run(Job.initJobs,5);
  run(runJobs, 5);
}

module.exports = { runJobs, run, mainLoop, syncDevices, KillFn }
