
const { Trigger } = require('../../db/postgres-triggers/triggers');

describe('trigger query builder',function(){


  it.skip('should build query',function(){
  
    
    let trigger = Trigger()
    .drop(true)
    .table('PostJobs')
    .alias('postjob_notification')
    .after({ update: 'status' })
    //.args(['id','PostId','AccountId','IGAccountId'])
    .exec('postjob_notification')

    console.log(trigger.query);
  
  
  })


});
