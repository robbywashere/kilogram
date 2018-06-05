
const baseServer = require('../../core/baseServer');
const request = require('supertest');

describe('baseServer', () => {
  it('should respond Unauthorized to /api/user', async () => {
    const app = await baseServer({ syncDb: async () => {}, minioClient: { init: async () => {} } });
    await request(app)
      .get('/api/user')
      .expect(401);
  });
});
