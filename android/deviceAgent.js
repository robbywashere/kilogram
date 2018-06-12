const { PythonBridge } = require('./bridge');
const { Device } = require('../objects');

class Agent {
  constructor({ deviceId = demand('deviceId') }) {
    this.deviceId = deviceId;
  }

  async exec({ cmd = demand('cmd'), args = {} } = demand('{ cmd, args<optional>}')) {
    try {
      if (!this._bridge) this.connect();
      return this._bridge.cmd(cmd, args);
    } catch (e) {
      await this.killCleanFree();
      throw e;
    }
  }
  connect() {
    this._bridge = new PythonBridge(this.deviceId);
    return this._bridge;
  }
  // TODO: write tests for this
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
