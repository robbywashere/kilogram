
const assert = require('assert');
const streamify = require('stream-array');
const { MClient } = require('../../server-lib/minio');
const Routes = require('../../controllers/minio');
const { exprezz, request } = require('../helpers');

const bucket = 'testbucket';
const sinon = require('sinon');
const syncDB = require('../../db/sync');
const { Photo } = require('../../models');

describe('server', () => {
  beforeEach(syncDB);
  describe('minio router', () => {
    describe('GET /objects', () => {
      it('should list objects in bucket', async () => {
        const app = exprezz();
        const client = {
          presignedGetObject: sinon.stub().resolves('http://fakeurl/object'),
          listObjects: sinon.stub().returns(streamify([{}, {}, {}])),
        };
        const mc = new MClient({ bucket, client });
        app.use(Routes({ minioClient: mc }));
        const expectation = [
          { bucketName: 'testbucket', url: 'http://fakeurl/object' },
          { bucketName: 'testbucket', url: 'http://fakeurl/object' },
          { bucketName: 'testbucket', url: 'http://fakeurl/object' },
        ];

        const response = await request(app)
          .get('/objects')
          .expect(200);
        assert.deepEqual(expectation, response.body);
      });
    });

    describe.skip('POST /uploads?name=', () => {
      // THIS IS ALREADY TEST ;)
    });
    describe('DELETE /objects?name=', () => {
      it('should remove the object from the minio store', async () => {
        const app = exprezz();
        const client = {
          removeObject: sinon.mock().returns(Promise.resolve()),
        };
        const mc = new MClient({ bucket, client });
        app.use(Routes({ minioClient: mc }));

        const response = await request(app)
          .delete('/objects?name=photo.jpg')
          .expect(200);

        assert(client.removeObject.calledWith(bucket, 'photo.jpg'));
      });
    });
  });
});
