
process.env.NODE_ENV = 'test'; // TODO ?
const { Job } = require('../objects');

const sinon = require('sinon');
const assert = require('assert');
const sync = require('../db/sync');
beforeEach(async ()=> {
  return sync(true);
});

describe('objects/Jobs', function(){

  describe('outstanding' ,function() {

    it ('should report outstanding jobs', async function(){
      const j = await Job.create({
        args: { arg1: 1 },
        cmd: 'cmd',
      })
      const jNot = await Job.create({
        args: { arg1: 1 },
        cmd: 'cmd',
        inprog: true,
        finish: false
      })

      const jNot2 = await Job.create({
        args: { arg1: 1 },
        cmd: 'cmd',
        inprog: false,
        finish: true
      })

      let jOut = await Job.outstanding();

      assert.equal(1, jOut.length)

      assert.equal(j.id, jOut[0].id)
    })
  });




})
