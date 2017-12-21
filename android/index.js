
const cmds = require('./cmds');
const Promise = require('bluebird');
const { Device } = require('../objects');
const logger = require('../logger');

async syncDevices() {
  try {
    const adbDevices = await cmds.adbDevices();
    logger.debug(deviceList);
    Device.syncOnline(adbDevices);
  } catch(e) {
    logger.error(e);
    // TODO: error report 
  }
  await Promise.delay(interval);
}

module.exports = {
  syncDevices
}

