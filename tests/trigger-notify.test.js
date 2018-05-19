
const { Account, IGAccount } = require('../objects');
const dbSync = require('../db/sync');
const { delay } = require('bluebird');

const PGListen = require('../server-lib/pg-listen');

describe('trigger notify functionality',function(){


  let pgListener = new PGListen({ debug: true });

  beforeEach(()=>dbSync(true));

  afterEach(()=>pgListener.disconnect());

  it.only('Should notify when updating IGAccount.status', async function(){

    this.timeout(Infinity);

    await pgListener.connect();

    await pgListener.subscribe('igaccount_status',console.log)

    const account = await Account.create();

    const chans = await pgListener.getChannels();

    //   await pgListener.client.query(`NOTIFY "igaccount_status", 'xxx'`);

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
