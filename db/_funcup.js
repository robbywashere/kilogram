const { funcUp } = require('./migrateDb');
const cmd = require('../lib/handleCmd');

cmd(funcUp());
