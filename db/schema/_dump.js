const pgdump = require('./pg_dump_schema');
const dbConfig = require('../config');
const dbSync = require('../sync');
const config = require('config');
const path = require('path');

dbSync(true).then(()=>{
  const schemaPath = path.join(__dirname,`schema.snapshot.sql`);
  const { username, database } = dbConfig['development'];
  pgdump({ path: schemaPath, username, database });
  process.exit(0);
})
