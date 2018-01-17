const mo = require('../server-lib/minio/minioObject');
const uuidv4 = require('uuid/v4');
const assert = require('assert');

describe('minio object store format', function(){
  const uuid = uuidv4();
  const userId = 111010100110101011;
  const extension = 'jpg';
  const meta = {text: 'XX😳XXX:XYY:YYYYX:XXXXYYYY+?=221dsad21313:12313' };

  describe.skip('v1',  function () {
    it ('should encode and decode', function(done){
      const args = {  uuid, meta, userId, extension }
      const result = mo.create('v1', args);
      console.log('v1',{ length: result.length, result })
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result))
      done();
    })
  })

  describe('v2',  function () {
    it ('should encode and decode', function(done){
      const args = {  uuid, meta, userId, extension }
      const result = mo.create('v2', args);
      console.log('v2',{ length: result.length, result })
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result))
      done();
    })
  })


  describe('v3',  function () {
    it ('should encode and decode', function(done){
      const args = {  uuid, meta, userId, extension }
      const result = mo.create('v3', args);
      console.log('v3',{ length: result.length, result })
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result))
      done();
    })
  })

  describe('v4',  function () {
    it ('should encode and decode', function(done){
      const args = {  uuid, meta, userId, extension }
      const result = mo.create('v4', args);
      console.log('v4',{ length: result.length, result })
      assert(result.length <= 256);
      assert.deepEqual(args, mo.parse(result))
      done();
    })
  })
});
