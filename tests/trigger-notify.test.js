
const { Account, IGAccount } = require('../objects');
const dbSync = require('../db/sync');
const { delay } = require('bluebird');
const assert = require('assert');

const { logger } = require('../lib/logger');
const Watcher = require('../db/trigger-notify/watch');
const PGListen = require('../server-lib/pg-listen');
const { EventEmitter } = require('events');

describe('trigger notify functionality',function(){


  let watcher = {};

  beforeEach(()=>dbSync(true));
  afterEach(()=>((typeof watcher.disconnect === "function") ? watcher.disconnect() : null))

  //TODO: move 
  it('should persist PGListen connections', async function(){

    this.timeout(8500);

     return new Promise((resolve, reject)=>{
      try {
        let allowConnect = true;
        let count = 0;

        const pgClient = class Client extends EventEmitter {
          connect(){
            count++;
            if (count === 4) {
              allowConnect = true; 
              this.on('connect',resolve);
            }
            if (allowConnect) process.nextTick(()=>this.emit('connect'));
            else {
              process.nextTick(()=>this.emit('end'));
            }
          }
        }
        const pgListener = new PGListen({ debug: true, pgClient });
        pgListener.connect();
        allowConnect = false;
        pgListener.client.emit('end');
      }
      catch(e) {
        reject(e);
      }
    });


  })


  it(`object columns should 'triggerable'`, async function(){

    this.timeout(5000);

    watcher = new Watcher({ debug: logger.debug });

    await watcher.connect();

    const account = await Account.create();

    const ig = await IGAccount.create({ 
      username: 'ribbit', 
      password: 'secret',
      AccountId: account.id
    });


    const Q = new Promise((rs,rx) => {
      watcher.subscribe(IGAccount.Triggerables.status, function(payload){
        const { data: { status, id, AccountId }} = payload;
        try {
          assert.equal(status, 'GOOD');
          assert.equal(id,ig.id);
          assert.equal(AccountId,ig.AccountId);
          return rs();
        } catch(e) {
          rx(e)
        }
      })
    });

    ig.update({
      status: 'GOOD'
    })

    return Q;

  })







});
