const mo = require('../server-lib/minioObject');
const Uuid = require('uuid/v4');
const assert = require('assert');

describe('minio object store format', function(){



  describe('v1',  function () {
    it ('should encode and decode', function(done){
      const uuid = Uuid();
      const userId = '1110101001101';
      const extension = 'jpg';
      const meta = 'XXXXX:XYY:YYYYX:XXXXYYYY';
      const args = {  uuid, meta, userId, extension }
      const result = mo.create('v1', args);
      assert(result.length <= 1024);
      assert.deepEqual(args, mo.parse(result))
      done();
    })
  })

  describe('v2',  function () {
    it ('should encode and decode', function(done){
      const uuid = Uuid();
      const userId = '1110101001101';
      const extension = 'jpg';
      const meta = 'XXXXX:XYY:YYYYX:XXXXYYYY';
      const args = {  uuid, meta, userId, extension }
      const result = mo.create('v2', args);
      assert(result.length <= 1024);
      assert.deepEqual(args, mo.parse(result))
      done();
    })
  })


  describe('v3',  function () {
    it ('should encode and decode', function(done){
      const uuid = Uuid();
      const userId = '1110101001101';
      const extension = 'jpg';
      const meta = 'XXXXX:XYY:YYYYX:XXXXYYYY';
      const args = {  uuid, meta, userId, extension }
      const result = mo.create('v3', args);
      assert(result.length <= 1024);
      assert.deepEqual(args, mo.parse(result))
      done();
    })
  })
});
