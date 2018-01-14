
const { PythonBridge } = require('./bridge');

const { Job, BotchedJob, Device } = require('../objects');

const demand = require('../lib/demand');

const minio = require('../server-lib/minio');


class Agent {

  constructor({ deviceId = demand('deviceId') }){
    this.deviceId = deviceId;
  }

  async exec({ cmd=demand('cmd'), args={} } = demand('{ cmd, args<optional>}')){
    try {
      if (!this._bridge) this.connect();
      return this._bridge.cmd(cmd, args);

    } catch(e) {
      await this.killCleanFree();
      throw e;
    }
  }
  connect(){
    this._bridge = new PythonBridge(this.deviceId);
    return this._bridge;
  }
  //TODO: write tests for this
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


async function JobRun({ job = demand('job'), photo = demand('photo'), post = demand('post'), user = demand('user'), agent = demand('agent'), minioClient = (new minio.MClient()) }, throws = true) {
  let localfile;
  try {
    const mc = minioClient; 
    localfile = await mc.pullPhoto({ name: photo.objectName })
    const result = await agent.exec({ 
      cmd: 'full_dance', 
      args: {
        username: user.igUsername, //TODO: user.getCredentials();
        password: user.igPassword,
        desc: post.desc,
        localfile
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
    //TODO: await BotchedJob.new(job,{ cmd, args, error, adbId: device.adbId })
    if (throws) throw error;
  } finally {
    //TODO rm localfile
  
  }


}


module.exports = { JobRun, Agent }
