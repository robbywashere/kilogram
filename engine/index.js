
const cmds = require('../android/cmds');
const { Job, Device } = require('../objects');
const { logger } = require('../lib/logger');
const runner = require('../python/runner');
const Promise = require('bluebird');


async function syncDevices() {
  const devs = await cmds.adbDevices();
  await Device.freeDanglingByIds(devs); //TODO:???
  const resultOfSync = await Device.syncAll(devs);
  if (Object.entries(resultOfSync).map(([k,v])=>v).some(v=>v&&v.length)) {
    logger.status('DELTA ▲ - ',resultOfSync); 
  }
};


const run = function(fn, milliseconds){
  return setInterval(function(){
    fn().catch(e=>logger.critical(`Unhandled exception in function: ${fn.name}`,e))
  }, milliseconds);
}

//TODO: assure jobs are ran in priority order, by ids???? vs DATE???
 async function runJobs() {
  //TODO: try catch block
  const outstanding = await Job.outstanding();
  const freeDevices = await Device.free();
  logger.status({ freeDevices: freeDevices.length, outstandingJobs: outstanding.length })
  if (outstanding.length > 0 && freeDevices.length > 0) {
    const device = await Device.popDevice();

    if (device) {
      const job = await Job.popJob();
      if (job) {
        await job.reloadWithAll();
        const deviceId = device.get('adbId');
        const agent = new runner.Agent({ deviceId });
        logger.status(`Running Job: ${job.id}, Post: ${job.Post.id} IGAccount: ${job.IGAccount.id}, Device: ${deviceId}:${device.id}`);
        await runner.JobRun({ post: job.Post, agent, job: job, igAccount: job.IGAccount, photo: job.Post.Photo })
      }
      await device.setFree();
    }
  }
}

const main = function (){
  return [
    run(syncDevices,2000),
    run(Job.initJobs.bind(Job),2000),
    run(runJobs, 5000)
  ];
}

module.exports = { runJobs, run, main, syncDevices }
