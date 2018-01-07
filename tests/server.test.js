const request = require('supertest');
const assert = require('assert');
const streamify = require('stream-array')
const { MClient, Routes }  = require('../server-lib/minio');
const { exprezz } = require('./helpers');
const bucket = 'testbucket';
const sinon = require('sinon');
const syncDB = require('../db/sync');
const { Photo } = require('../objects');

describe('server', function(){

beforeEach(syncDB);
  describe('minio router', function(){
    describe('GET /objects', function(){


      it ('should list objects in bucket', async function(){
        const app = exprezz();
        const client = {
          presignedGetObject: sinon.stub().resolves('http://fakeurl/object'),
          listObjects: sinon.stub().returns(streamify([{},{},{}]))
        }
        const mc = new MClient({ bucket, client });
        app.use(Routes({ client: mc }))
        const  expectation = [ { bucketName: 'testbucket', url: 'http://fakeurl/object' },
          { bucketName: 'testbucket', url: 'http://fakeurl/object' },
          { bucketName: 'testbucket', url: 'http://fakeurl/object' } ]

        const response = await request(app).get('/objects').expect(200)
        assert.deepEqual(expectation, response.body);
      })


    })

    describe('GET /uploads?name=', function(){

      it ('should get a signed url to upload to', async function(){
        const app = exprezz();
        const client = {
          presignedPutObject: sinon.mock().returns(Promise.resolve('http://fakeurl'))
        }
        const mc = new MClient({ bucket, client });
        app.use(Routes({ client: mc }))

        const response = await request(app).get('/uploads?name=photo.jpg').expect(200)

        assert(client.presignedPutObject.once())

        assert.equal(response.text, 'http://fakeurl');


      })


    })
    describe(`DELETE /objects?name=`, function(){



      it('should remove the object from the minio store', async function(){


        const app = exprezz();
        const client = {
          removeObject: sinon.mock().returns(Promise.resolve())
        }
        const mc = new MClient({ bucket, client });
        app.use(Routes({ client: mc }))

        const response = await request(app).delete('/objects?name=photo.jpg').expect(200)

        assert(client.removeObject.calledWith(bucket, 'photo.jpg'))

      })



    })



  })

})
