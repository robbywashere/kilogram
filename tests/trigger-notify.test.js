
const { Account, IGAccount } = require('../objects');
const dbSync = require('../db/sync');
const { delay } = require('bluebird');

const PGListen = require('../server-lib/pg-listen');

describe('trigger notify functionality',function(){


  beforeEach(()=>dbSync(true));



  it.only(`object columns should 'triggerable'`, async function(){


     console.log(IGAccount.Triggerables.status);

  
  })

  it.skip('Should notify when updating IGAccount.status', async function(){

    this.timeout(Infinity);

    const pgListener = new PGListen({ debug: true });

    await pgListener.connect();

    await pgListener.subscribe('igaccount_status',console.log)

    const account = await Account.create();

    const chans = await pgListener.getChannels();
    
    console.log(chans);

    const ig = await IGAccount.create({ 
      username: 'ribbit', 
      password: 'secret',
      AccountId: account.id
    });

    await ig.update({
      status: 'GOOD'
    })


    const i = await IGAccount.findOne();


  })






});
