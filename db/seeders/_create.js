const cmd = require('../../lib/handleCmd');
cmd(require('./index').create(process.argv.slice(2).join(' ')));
