const pgdump = require('./pg_dump_schema');
const dbConfig = require('../config');
const config = require('config');
const path = require('path');

const schemaPath = path.join(__dirname,`schema.snapshot.sql`);

const { username, database } = dbConfig['development'];

pgdump({ path: schemaPath, username, database });

