const { schemaUp } = require('./migrateDb');
const cmd = require('../lib/handleCmd');

cmd(schemaUp());
