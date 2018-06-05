const { migUp } = require('./migrateDb');
const cmd = require('../lib/handleCmd');

cmd(migUp());
