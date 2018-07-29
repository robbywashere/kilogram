const { PythonBridge } = require('./bridge');
const demand = require('../lib/demand');
const { Device } = require('../models');

class Agent {
  constructor({ deviceId = demand('deviceId') }) {
    this.deviceId = deviceId;
  }

  async exec({ cmd = demand('cmd'), args = {} } = demand('{ cmd, args <optional> }'), outputFn) {
    try {
      if (!this._bridge) this.connect();
      return this._bridge.cmd(cmd, args, outputFn);
    } catch (e) {
      await this.killCleanFree();
      throw e;
    }
  }
  connect() {
    this._bridge = new PythonBridge(this.deviceId);
    return this._bridge;
  }
  // 2018-06-15T19:14:17+0700 TODO: write tests for this

  kill() {
    if (this._bridge && this._bridge.childProcess) this._bridge.childProcess.kill();
  }
  async killCleanFree() {
    this.kill();
    this.connect();
    await this._bridge.cmd('clean_slate');
    await Device.setFree(this.deviceId);
  }
}

module.exports = { Agent };
