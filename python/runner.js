
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


async function JobRun({ job = demand('job'), photo = demand('photo'), post = demand('post'), igAccount = demand('igAccount'), agent = demand('agent'), minioClient = (new minio.MClient()) }) {
  const mc = minioClient; 
  let localfile = await mc.pullPhoto({ name: photo.objectName })
  const result = await agent.exec({ 
    cmd: 'full_dance', 
    args: {
      username: igAccount.username, 
      password: igAccount.password,
      desc: post.text,
      localfile
    } 
  });

  await job.update(result);

  return result;
}


module.exports = { JobRun, Agent }
