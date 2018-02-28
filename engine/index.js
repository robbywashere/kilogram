
const cmds = require('../android/cmds');
const { Job, Device } = require('../objects');
const { logger } = require('../lib/logger');
const runner = require('../python/runner');
const Promise = require('bluebird');
const columnify = require('columnify');

const { startCase, fromPairs, clone, isEqual } = require('lodash');

//const status = (r) => logger.status('\n',columnify(r,{ showHeaders: false }),'\n\n');
const status = (r) => logger.status(r);

async function syncDevices() {
  const devs = await cmds.adbDevices();
  await Device.freeDanglingByIds(devs); //TODO:???
  const result = await Device.syncAll(devs);
  const output = fromPairs(Object.entries(result).map(([k,v])=>[startCase(k),(v&&v.length)? v.join(','):'*' ] ));
  const shouldLog = Object.entries(result).map(([k,v])=>v).some(v=>v&&v.length);
  if (shouldLog) status(output) 
};


const run = function(fn, milliseconds){
  return setInterval(function(){
    fn().catch(e=>logger.critical(`Unhandled exception in function: ${fn.name}`,e))
  }, milliseconds);
}

//TODO: assure jobs are ran in priority order, by ids???? vs DATE???
function runJobs() {
  let store = {};
  //TODO: try catch block
  return async function(){
    const outstanding = await Job.outstanding();
    const freeDevices = await Device.free();
    const result = { 
      'Free Devices': freeDevices.length, 
      'Outstanding Jobs': outstanding.length 
    };

    if (!isEqual(store,result)) {
      status(result);
    }

    store = clone(result);

    if (outstanding.length > 0 && freeDevices.length > 0) {
      const device = await Device.popDevice();

      if (device) {
        const job = await Job.popJob();
        if (job) {
          await job.reloadWithAll();
          const deviceId = device.get('adbId');
          const agent = new runner.Agent({ deviceId });
          status({ 
            'Running Job': job.id,
            'Post': job.Post.id,
            'IG Account': job.IGAccount.id, 
            'Device': `${deviceId}:${device.id}`
          });
          await runner.JobRun({ post: job.Post, agent, job: job, igAccount: job.IGAccount, photo: job.Post.Photo })
        }
        await device.setFree();
      }
    }
  }
}

const main = function (){

  return [
    run(syncDevices,2000),
    run(Job.initJobs.bind(Job),2000),
    run(runJobs(), 5000)
  ];
}

module.exports = { runJobs, run, main, syncDevices }
