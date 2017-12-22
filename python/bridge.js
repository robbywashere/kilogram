const config = require('config');
const Promise = require('bluebird');
const { logger } = require('../lib/logger');
const PythonShell = require('python-shell');


class PythonBridge {

  constructor(deviceId, log = logger) {
    this.deviceId = deviceId;
    this.logger = log;

    this.shell = new PythonShell('device.py', {
      pythonPath: config.PYTHON_PATH,
      scriptPath: __dirname + '/../python',
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

  cmd(method, args = {}, outputFn = ()=>{}) {
    return new Promise((resolve, reject) => {
      this.shell.send({
        deviceId: this.deviceId,
        args,
        method,
      });

      this.shell.on('message', (message) => {
        if (typeof message === 'object') {
          outputFn(message);
          this.lastMsg = message;
        }
        else {
          this.logger(` Device ID: ${this.deviceId} - ${message}`);
        }
      });

      this.shell.end((err) => {
        if (err) reject(err)
        this.logger(`Method: ${method} - finished`);
        resolve(this.lastMsg);
      });
    });
  }
}

module.exports = { PythonBridge }

