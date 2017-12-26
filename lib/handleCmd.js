const { logger } = require('../lib/logger');
module.exports = function(p){
  return p.then(()=>{ logger('success!'); process.exit(0) }).catch(e=>{ logger.error(e); process.exit(1) });
}
