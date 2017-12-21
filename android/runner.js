const PythonShell = require('python-shell');
const Promise = require('bluebird');
const config = require('config');
const log = require('../lib/logger')

async function cmdRunner(did, cmd, args){
  let d;
  try {
    d = new Device(did);
    await d.cmd(cmd, args)
  } catch(e) {
    if (d.childProcess) d.childProcess.kill();
    d = new Device(did);
    await d.cmd('clean_slate')
    return Promise.reject(e);
  }
}

class Device {

  constructor(deviceId, logger = log) {
    this.deviceId = deviceId;
    this.logger = logger;

    this.shell = new PythonShell('device.py', {
      pythonPath: config.PYTHON_PATH,
      scriptPath: __dirname + '../python',
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

module.exports = { cmdRunner, Device}


/* cmdRunner('6d0b5815','full_dance',{
  username: '*****',
  password: '*****',
  localfile: '/Users/robby/Desktop/tulips.jpg',
  desc: '#flowers'
}).catch(console.error) */
