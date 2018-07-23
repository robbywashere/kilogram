const mo = require('../../server-lib/minio/minioObject');
const uuidv4 = require('uuid/v4');
const assert = require('assert');
const { logger } = require('../../lib/logger');

describe('minio object store format', () => {
  const uuid = uuidv4();
  const userId = 11101010010101011;
  const extension = 'jpg';
  const meta = { text: 'XX😳XXX:XYY:YYYYX:XXXXYYYY+?=221dsad21313:12313' };

  describe.skip('v1', () => {
    it('should encode and decode', (done) => {
      const args = {
        uuid,
        meta,
        userId,
        extension,
      };
      const result = mo.create('v1', args);
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result));
      done();
    });
  });

  describe('v2', () => {
    it('should encode and decode', (done) => {
      const args = {
        uuid,
        meta,
        userId,
        extension,
      };
      const result = mo.create('v2', args);
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result));
      done();
    });
  });

  describe('v3', () => {
    it('should encode and decode', (done) => {
      const args = {
        uuid,
        meta,
        userId,
        extension,
      };
      const result = mo.create('v3', args);
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result));
      done();
    });
  });

  describe('v4', () => {
    it('should encode and decode', (done) => {
      const args = {
        uuid,
        meta,
        userId,
        extension,
      };
      const result = mo.create('v4', args);
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result));
      done();
    });
  });

  describe('v5', () => {
    it('should encode and decode', (done) => {
      const args = {
        uuid,
        meta,
        userId,
        extension,
      };
      const result = mo.create('v5', args);
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result));
      done();
    });
  });
});
