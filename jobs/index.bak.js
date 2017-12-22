
const { Job, BotchedJob, Device } = require('../objects');
const { cmdRunner } =  require('../android/runner');

module.exports = class JobRunner {

  constructor({ job,device }) {
    this.job = job;
    this.device = device;
  }

  async go({throws = true } = {}){

    try {
      await this.job.update({
        inprog: true
      });
      const { cmd, args } = this.job;
      const { adbId } = this.device;
      const result = await cmdRunner(adbId, cmd, args);
      await this.job.update({
        inprog: false,
        finish: true,
        outcome: (result && typeof result === "object") ? result : { success: true }
      })
    } catch(error) {
      await this.job.update({ inprog: false });
      const { cmd, args } = this.job;
      await BotchedJob.new(this.job,{ cmd, args, error, adbId: this.device.adbId })
      if (throws) throw error;
    }


  }

}
