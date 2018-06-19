
const { Trigger } = require('../../db/postgres-triggers/triggers');

describe('trigger query builder',function(){


  it('should build query',function(){
  
    
    let trigger = Trigger()
    .drop(true)
    .table('PostJobs')
    .alias('postjob_notification')
    .after({ update: 'status' })
    .args(false)
    .exec('postjob_notification')

  })


});
