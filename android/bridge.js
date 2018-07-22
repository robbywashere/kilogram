const config = require('config');
const Promise = require('bluebird');
const { logger } = require('../lib/logger');
const PythonShell = require('python-shell');
//const { EventEmitter } = require('events');


class PythonBridge {
  constructor(deviceId, log = logger) {
    this.deviceId = deviceId;
    this.logger = log;
    // this.events = new EventEmitter();
  }

  static shell() {
    return new PythonShell('coupling.py', {
      pythonPath: config.get('PYTHON_PATH'),
      scriptPath: `${__dirname}`,
      mode: 'json',
      parser: (output) => {
        try {
          return JSON.parse(output);
        } catch (e) {
          return output;
        }
      },
    });
  }

  cmd(method, args = {}) {
    return new Promise((resolve, reject) => {
      const shell = PythonBridge.shell();
      shell.send({
        deviceId: this.deviceId,
        args,
        method,
      });

      shell.on('error', (err) => {
        reject(err);
      });

      shell.on('message', (message) => {
        if (typeof message === 'object') {
          //TODO: instead of a single result, move the data flow
          //to event an emitter of this class
          this.result = message;
        } else {
          this.logger(` Device ID: ${this.deviceId} - ${message}`);
        }
      });

      shell.end((err) => {
        if (err) reject(err);
        this.logger(`Method: ${method} - finished`);
        resolve(this.result);
      });
    });
  }
}

module.exports = { PythonBridge };

