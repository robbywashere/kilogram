
const cmds = require('../android/cmds');
const { PostJob, VerifyIGJob, Device } = require('../objects');
const { logger } = require('../lib/logger');
const Runner = require('../python/runner');
const DeviceAgent  = require('../python/deviceAgent');

const { get, isUndefined, zipObject, startCase, fromPairs, clone, isEqual } = require('lodash');

//TODO: create CriticalError type which crashes everything?
//TODO: safe logger?
//TODO: error handling is bonkers
//TODO: assure jobs run in priority order, by ids since incremental
//TODO: !!!Jobs are essentially state machines, and maybe should be implimented more clearly as such to assist in better logging and error handling


function logDiff(logFn = console.log) {
  let oldStatus = {};
  return (newStatus) => {
    if (!isEqual(oldStatus,newStatus)) {
      logFn(newStatus);
    }
    oldStatus = clone(newStatus);
  }
}


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

//const { associations, name } = job.constructor; 

  /*async function runJobWithDevice({ job, device }) {
  const deviceId = device.get('adbId');
  const agent = new DeviceAgent.Agent({ deviceId });
  let jobResult = await Runner.PostJobRun({ 
    agent, 
    job, 
  });
  if (jobResult && jobResult.success === false) throw new Error(jobResult.error)

  await job.complete(jobResult);

  logger.status(`-- PostJob Run cycle complete job_id: ${job.id}, success: ${jobResult.success}`);

  logger.status(`----- Result: `,(jobResult) ? jobResult : 'None');
}*/



function jobsStats(stats = {}, freeDevices = []){
  return { 
    ...zipObject(Object.keys(stats).map(startCase),Object.values(stats)),
    'Free Devices': (freeDevices).length, 
  };
}

function jobStats(job){
  const associations = Object.keys(job.constructor.associations);
  return { 
    ...associations.reduce((p,key) => { 
      p[`${startCase(key)} Id`] = get(job,`${key}Id`); return p } ,{})
  };
}




//TODO: Jobs may not always be device dependent! different function?
function runJobs({ JobModel = PostJob, JobRunner = Runner.PostJobRun } = {}) {

  const diffLogger = logDiff(logger.status); //Logs only on deltas duh!
  return async function(){
    let device;
    let job;
    try {
      const stats = await JobModel.stats();
      const freeDevices = await Device.free();

      logger.status(jobsStats(stats, freeDevices))


      if (stats.outstanding > 0 && freeDevices.length > 0) {
        if ((device = await Device.popDevice()) && (job = await JobModel.popJob())) {
          try {
            const deviceId = device.get('adbId');
            const agent = new DeviceAgent.Agent({ deviceId });

            await job.denormalize(); // Loads Job data from Id's into 'job' object

            logger.status(jobStats(job));

            let jobResult = await JobRunner({ 
              ...job,
              agent, 
              job, 
            });

            if (jobResult && jobResult.success === false) throw new Error(jobResult.error)

            await job.complete(jobResult);

            logger.status(`-- ${JobModel} Run cycle complete job_id: ${job.id}, success: ${jobResult.success}`);

            logger.status(`----- Result: `,(jobResult) ? jobResult : 'None');


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

    run(PostJob.initJobs,1000), // Turns posts into queued jobs

    run(runJobs({ JobModel: PostJob, JobRunner: Runner.PostJobRun }), 2000),

    run(runJobs({ JobModel: VerifyIGJob, JobRunner: Runner.VerifyIGJobRunner }), 2000)

  ];
}

module.exports = { runJobs, run, main, syncDevices }
