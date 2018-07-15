
const {
  get, isUndefined, zipObject, startCase, fromPairs, clone, isEqual,
} = require('lodash');

function allJobsStats(stats = {}, freeDevices = []) {
  return {
    ...zipObject(Object.keys(stats).map(startCase), Object.values(stats)),
    'Free Devices': (freeDevices).length,
  };
}
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

function jobStats(job) {
  const associations = Object.keys(job.constructor.associations);
  return {
    ...associations.reduce((p, key) => {
      p[`${startCase(key)} Id`] = get(job, `${key}Id`); return p;
    }, {}),
  };
}
