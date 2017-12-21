
const exec = require('../android/exec');
const cmds = require('../android/cmds');
const fixies = require('./helpers').fixtures();
const sinon = require('sinon');
const assert = require('assert');


describe('android', function(){
  describe('cmds/adbDevices', function(){
    it ('should parse output of `adb devices` and return an array of devices ids', async function(){
      const stub = sinon.stub(exec,'$').resolves({ stdout: fixies['adb-devices'] })
      const devices = await cmds.adbDevices();
      const target = [ 'emulator-5556', 'emulator-5554', '0a388e93' ]
      assert.deepEqual(target.sort(), devices.sort());
      stub.restore();
    })
    it ('should return empty arry when `adb devices` returns nothing', async function(){
      sinon.stub(exec,'$').resolves({ stdout: `List of devices attached\n\n` })
      const devices = await cmds.adbDevices();
      assert.deepEqual([], devices);
    })
  
  })



})
