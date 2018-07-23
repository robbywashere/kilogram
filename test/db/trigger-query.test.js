const { Trigger } = require('../../db/postgres-triggers/triggers');

describe('trigger query builder', () => {
  it('should build query', () => {
    const trigger = Trigger()
      .drop(true)
      .table('PostJobs')
      .alias('postjob_notification')
      .after({ update: 'status' })
      .args(false)
      .exec('postjob_notification');
  });
});
