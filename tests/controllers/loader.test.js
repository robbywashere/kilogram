
const { load, parsePaths, endpoint, isCntrlFile } = require('../../controllers/_load');

const sinon = require('sinon');

describe('_load.js', function(){

  it.skip('should load a given path into app with MClient and prefix', function(){
  
    const params = { 
      paths: ['path'],
      app: { use: sinon.spy() },
      client: true,
      prefix: '/prefix',
      requireFn: sinon.mock()
    };

    load(params);
  
  
  })


})


