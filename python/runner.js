
const { PythonBridge } = require('./bridge');

const { Job, BotchedJob, Device } = require('../objects');

const demand = require('../lib/demand');


class Agent {

  constructor({ deviceId = demand('deviceId') }){
    this.deviceId = deviceId;
  }

  async exec({ cmd=demain('cmd'), args={} } = demand('{ cmd, args<optional>}')){
    try {
      if (!this._bridge) this.connect();
      return this._bridge.cmd(cmd, args);

    } catch(e) {
      await killCleanFree();
      throw e;
    }
  }
  connect(){
    this._bridge = new PythonBridge(this.deviceId);
    return this._bridge;
  }
  kill(){ 
    if (this._bridge && this._bridge.childProcess) this._bridge.childProcess.kill();
  }
  async killCleanFree(){
    this.kill();
    this.connect();
    await this._bridge.cmd('clean_slate');
    await Device.setFree(this.deviceId);
  }


}


async function JobRun({ job, photo, post, user, agent }, throws = true) {


  try {

    const result = await agent.exec({ 
      cmd: 'full_dance', 
      args: {
        username: user.igUsername,
        password: user.igPassword,
        desc: post.desc,
        objectname: photo.get('src')
      } 
    });

    await job.update({
      inprog: false,
      finish: true,
      outcome: (result && typeof result === "object") ? result : { success: true }
    })

    return result;

  } catch(error) {
    await job.update({ inprog: false, finish: false, outcome: { success: false, error: error.toString() }});
    //const { cmd, args } = job;
    //TODO: await BotchedJob.new(job,{ cmd, args, error, adbId: device.adbId })
    if (throws) throw error;
  }


}


module.exports = { JobRun, Agent }
