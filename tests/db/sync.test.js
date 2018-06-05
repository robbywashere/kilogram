
const sinon = require('sinon');
const dbSync = require('../../db/sync');

describe('db sync',function(){

  it.skip('should retry db connection errors', async function(){

    await dbSync();


  })

})
