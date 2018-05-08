
const cmds = require('../android/cmds');
const { Job, Device } = require('../objects');
const { logger } = require('../lib/logger');
const Runner = require('../python/runner');
const DeviceAgent  = require('../python/deviceAgent');
const Promise = require('bluebird');
const columnify = require('columnify');
const logDiff = require('../lib/logDiff');

const { zipObject, startCase, fromPairs, clone, isEqual } = require('lodash');

//TODO: create CriticalError type which crashes everything?
//TODO: safe logger?
//TODO: error handling is bonkers
//TODO: assure jobs run in priority order, by ids since incremental
//TODO: !!!Jobs are essentially state machines, and maybe should be implimented more clearly as such to assist in better logging and error handling



//const status = (r) => logger.status('\n',columnify(r,{ showHeaders: false }),'\n\n');
const status = logger.status;

function logDeviceSync(result) {
  try {
    if (Object.entries(result).map(([k,v])=>v).some(v=>v&&v.length)) {
      logger.status(fromPairs(Object.entries(result).map(([k,v])=>[startCase(k),(v&&v.length)? v.join(','):'*' ] ))); 
    }
  } catch(e) {
    try {
      logger.status(JSON.stringify(result,null,4))
    } catch(e2) {
      logger.error('hoplessly unable to log device sync result');
    }
  }
}

async function syncDevices() {
  const devs = await cmds.adbDevices();
  await Device.freeDanglingByIds(devs); //TODO:???
  await Device.syncAll(devs).then(logDeviceSync);
};


const run = function(fn, milliseconds){ // Job 'Harness' - Errors should never reach this point?
  return setInterval(function(){
    fn().catch(e=>logger.critical(`Unhandled exception in function: ${fn.name}`,e))
  }, milliseconds);
}


async function runJobWithDevice({ job, device }) {

  await job.reloadWithAll();
  const deviceId = device.get('adbId');
  const agent = new DeviceAgent.Agent({ deviceId });
  logger.status({ 
    'Running Job': job.id,
    'Post': job.Post.id,
    'IG Account': job.IGAccount.id, 
    'Device': deviceId
  });

  //TODO: Move Job Queue'ing and executing to python
  //TODO: figure out protocol to retry job in error cases, worst case scenario the job keeps posting photo to an account

  let jobResult = await Runner.JobRun({ 
    post: job.Post, 
    agent, 
    job: job, 
    igAccount: job.IGAccount, 
    photo: job.Post.Photo 
  });

  if (jobResult && jobResult.success === false) throw new Error(jobResult.error)

  await job.complete(jobResult);

  logger.status(`-- Job Run cycle complete job_id: ${job.id}, success: ${jobResult.success}`);

  logger.status(`----- Result: `,(jobResult) ? jobResult : 'None');


}



function logStats(logger, stats = {}, freeDevices = []){
  logger({ 
    ...zipObject(Object.keys(stats).map(startCase),Object.values(stats)),
    'Free Devices': (freeDevices).length, 
  });
}


function runJobs() {

  const diffLogger = logDiff(status); //Logs only on deltas duh!

  return async function(){

    let device;
    let job;

    try {
      const stats = await Job.stats();
      const freeDevices = await Device.free();

      logStats(diffLogger, stats, freeDevices);

      if (stats.outstanding > 0 && freeDevices.length > 0) {
        if (device = await Device.popDevice() && job = await Job.popJob()) {
          try {
            await runJobWithDevice({ job, device }); 
          } catch(err) {
            //TRY if fails critical error?
            await job.backout(err); // TODO !!!: backing out of job puts job in sleep mode, retry? retry with count?

            logger.error(`-- Error running Job: ${job.id}`); //TODO: logger.status??
            throw err;
          }
        }
      }
    } catch(e) {
      logger.error(`Error running 'runJobs' in engine/index.js,\n${e}`);
    } finally {
      if (device) {
        logger.status(`Freeing device-adbId: ${device.adbId}`);
        await device.setFree(); 
      }
    }
  }
}

const main = function (){
  return [
    run(syncDevices,1000),
    run(Job.initJobs.bind(Job),1000), // Turns posts into queued jobs
    //run(Job.initJobsFromPosts.bind(Job),1000), // Turns posts into queued jobs
    run(runJobs(), 2000) //executes queued jobs every
  ];
}

module.exports = { runJobs, run, main, syncDevices }
