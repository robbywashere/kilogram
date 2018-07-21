
const Spinner = require('../../engine/spinner');
const {
  main
} = require('../../engine');
const {
  createAccountUserPostJob,
  createUserAccountIGAccountPhotoPost,
  deviceFactory
} = require('../helpers');
const sinon = require('sinon');
const assert = require('assert');
const cmds = require('../../android/cmds');
const minio = require('../../server-lib/minio');
const {
  Account, IGAccount, Device, Post, PostJob, VerifyIGJob
} = require('../../objects');
const syncDb = require('../../db/sync');
const Runner = require('../../tasks');
const DeviceAgent = require('../../android/deviceAgent');

const Promise = require('bluebird');


describe.only('engine', ()=>{



  describe('Spinner', ()=>{


    it('Should continue call of given function with n concurrency x debounce time', ()=>{

      let count = 0;
      let myfn = async ()=>{
        count++;
        let countstr = count.toString();
        await Promise.resolve();
        return countstr;
      }

      const spin = new Spinner({ fn: myfn, concurrent: 3, debounce: 500 });

      spin.start().on('resolve',console.log);

      Promise.delay(3000).then(spin.stop.bind(spin));

    })



  })


})
