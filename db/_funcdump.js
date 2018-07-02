const { dumpFunctions } = require('./migrateDb');
const cmd = require('../lib/handleCmd');

cmd(dumpFunctions());
