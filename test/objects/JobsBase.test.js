const { createAccountUserPostJob } = require('../helpers');
const dbSync = require('../../db/sync');
const assert = require('assert');

describe('JobsBase', () => {
  beforeEach(() => dbSync(true));

  it("should increment 'attempts' after failed jobs, marking as FAILED when given max is reached", async () => {
    const { job } = await createAccountUserPostJob();
    const j1 = await job.retryTimes();
    assert.equal(j1.attempts, 1);
    assert.equal(j1.status, 'OPEN');
    const j2 = await job.retryTimes();
    assert.equal(j2.attempts, 2);
    assert.equal(j2.status, 'OPEN');
    const j3 = await job.retryTimes();
    assert.equal(j3.attempts, 3);
    assert.equal(j3.status, 'FAILED');
  });
});
