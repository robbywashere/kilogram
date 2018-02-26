
const { load, parsePaths, endpoint, isCntrlFile } = require('../../controllers/_load');

const fs = require('fs');
const sinon = require('sinon');
const { Router } = require('express');
const assert = require('assert');

describe('_load.js', function(){

  it('should load a given path into app with MClient and prefix', function(){

    const appSpy = { use: sinon.spy() };

    const router = new Router();

    const routerStub = sinon.stub().returns(router);

    const params = { 
      paths: [{ path: 'someFile', endpoint: '/endpoint'}],
      app: appSpy,
      minioClient: true,
      prefix: '/prefix',
      requireFn: sinon.stub().returns(routerStub)
    };

    load(params);

    assert(params.requireFn.calledWith('someFile'))

    assert(routerStub.calledWith({ app: params.app, minioClient: true }))

    assert(params.app.use.calledWith('/prefix/endpoint',router));

  })


  it ('should recognize cntrl file', function() {

    assert(isCntrlFile('index.js'));
    assert(!isCntrlFile('_name.js'));
    assert(!isCntrlFile('.name.js'));

  })


  it ('should parsePaths given a directory', function(){

    let stub1;
    let lstatStub;

    stub1 = sinon.stub(fs,'readdirSync')
      .onCall(0)
      .returns(['user','account'])
      .returns(['index.js','.file.js'])


    lstatStub = sinon.stub(fs,'lstatSync').returns({ 
      isDirectory: ()=> true,
      isFile: ()=> true
    })

    const result = parsePaths('/Absolute/Root/');

    assert.deepEqual(result,[{ 
      path: '/Absolute/Root/user/index.js', 
      endpoint: '/user/' },{ 
        path: '/Absolute/Root/account/index.js',
        endpoint: '/account/' } 
    ])

    stub1.restore();
    lstatStub.restore();

    stub1 = sinon.stub(fs,'readdirSync')
      .onCall(0)
      .returns(['user','account'])
      .returns(['action.js'])


    lstatStub = sinon.stub(fs,'lstatSync').returns({ 
      isDirectory: ()=> true,
      isFile: ()=> true
    })

    const result2 = parsePaths('/Absolute/Root/');

    assert.deepEqual(result2,[{ 
      path: '/Absolute/Root/user/action.js', 
      endpoint: '/user/action' },{ 
        path: '/Absolute/Root/account/action.js',
        endpoint: '/account/action' } 
    ])



    stub1.restore();
    lstatStub.restore();


  });

})


