
const sinon = require('sinon');
const dbSync = require('../../db/sync');

describe('db sync', () => {
  it.skip('should retry db connection errors', async () => {
    await dbSync();
  });
});
