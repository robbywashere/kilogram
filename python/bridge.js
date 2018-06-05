const config = require('config');
const Promise = require('bluebird');
const { logger } = require('../lib/logger');
const PythonShell = require('python-shell');


class PythonBridge {
  constructor(deviceId, log = logger) {
    this.deviceId = deviceId;
    this.logger = log;
  }

  static shell() {
    return new PythonShell('coupling.py', {
      pythonPath: config.get('PYTHON_PATH'),
      scriptPath: `${__dirname}/../python`,
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

  cmd(method, args = {}, outputFn = () => {}) {
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
          outputFn(message);
          this.lastMsg = message;
        } else {
          this.logger(` Device ID: ${this.deviceId} - ${message}`);
        }
      });

      shell.end((err) => {
        if (err) reject(err);
        this.logger(`Method: ${method} - finished`);
        resolve(this.lastMsg);
      });
    });
  }
}

module.exports = { PythonBridge };

