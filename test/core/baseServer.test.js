const baseServer = require('../../server/baseServer');
const { request } = require('../helpers');

describe('baseServer', () => {
  it('should respond Unauthorized to /api/user', async () => {
    const app = await baseServer({ syncDb: async () => {}, minioClient: { init: async () => {} } });
    await request(app)
      .get('/api/user')
      .expect(401);
  });
});
