
const { Account, IGAccount } = require('../objects');
const dbSync = require('../db/sync');
const { delay } = require('bluebird');
const assert = require('assert');

const { logger } = require('../lib/logger');
const Watcher = require('../db/trigger-notify/watch');
const PGListen = require('../server-lib/pg-listen');

describe('trigger notify functionality',function(){


  let watcher = {};

  beforeEach(()=>dbSync(true));
  afterEach(()=>((typeof watcher.disconnect === "function") ? watcher.disconnect() : null))

  it.skip('should persist PGListen connections', async function(){
  
    const pgListener = new PGListen({ debug: true });

    pgListener.events.on('connect',()=>connects++);

  
  })
  

  it.only(`object columns should 'triggerable'`, async function(){

    this.timeout(10000);

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
