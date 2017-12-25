
const { PythonBridge } = require('./bridge');

const { Job, BotchedJob, Device } = require('../objects');


class Agent {
  async exec({ cmd, args }){
    try {
      return this._bridge.cmd(cmd, args);

    } catch(e) {
      await killCleanFree();
      throw e;
    }
  }
  connect(did){
    this.did = did;
    this._bridge = new PythonBridge(did);
    return this._bridge;
  }
  kill(){ 
    if (this._bridge && this._bridge.childProcess) this._bridge.childProcess.kill();
  }
  async killCleanFree(){

    this.kill();
    if (this.did) {
      let pb = new PythonBridge(this.did); 
      await pb.cmd('clean_slate');
      await Device.setFree(this.did);
    }

  }


}


class JobRunner {

  constructor({ job, device, agent }) {
    this.job = job;
    this.device = device;
    this.agent = agent;
  }

    /*inprog(val = true){
    return this.job.update({
      inprog: val 
    });
  }*/

  async exec({throws = true } = {}){

    try {
      // await this.inprog();
      const { cmd, args } = this.job;
      const { adbId } = this.device;

      if (typeof this.agent._bridge === "undefined") {
        this.agent.connect(adbId);
      }

      const result = await this.agent.exec({ cmd, args });

      await this.job.update({
        inprog: false,
        finish: true,
        outcome: (result && typeof result === "object") ? result : { success: true }
      })

      return result;
    } catch(error) {
      await this.job.update({ inprog: false, finish: false, outcome: error});
      const { cmd, args } = this.job;
      await BotchedJob.new(this.job,{ cmd, args, error, adbId: this.device.adbId })
      if (throws) throw error;
    }
  }
}

module.exports = { JobRunner, Agent }
