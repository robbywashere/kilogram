
const baseServer = require('../baseServer');
const request = require('supertest');

describe('baseServer', function(){


  it('should respond Unauthorized to /api/user',async function(){
    const app = await baseServer({ syncDb: async ()=>{}, minioClient: { init: async ()=>{} } });
    await request(app)
      .get('/api/user')
      .expect(401);
  })


})
