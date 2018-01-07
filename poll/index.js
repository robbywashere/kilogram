
const { adbDevices } = require('../android/cmds');
const { Job, Device } = require('../objects');
const { logger } = require('../lib/logger');
const { JobRun, Agent } = require('../python/runner');

const syncDevices = async () => {
  const devs = await adbDevices();
  await Device.freeDanglingByIds(devs); //TODO:???
  await Device.syncAll(devs);
};

const run = async ({ fn, seconds }) => {
  for(;;) {
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
  const outstanding = await Job.outstanding();
  const freeDevices = await Device.free();
  if (outstanding.length > 0 && freeDevices.length > 0) {
    const device = await Device.popDevice();
    if (device) {
      const job = await Job.popJob();
      if (job) {
        await job.reloadWithAll();
        const deviceId = device.get('id');
        const agent = new Agent(deviceId);
        await JobRun({ agent, job: job, user: job.User, photo: job.Post.Photo })
      } else {
        Device.setFree();
      }
    }
  }
}

const mainLoop= () => {
  run(syncDevices,10);
  run(Job.initJobs,5);
  run(runJobs, 5);
}
