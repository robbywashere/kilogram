
const dbs = require('./config');

const { execSync } = require('child_process');


Object.entries(dbs).forEach(([_, env])=>{
  const db = env.database
  try {
  execSync(`psql --command "CREATE DATABASE ${db}"`)
  } catch(e) {
    console.error(e.toString());
  }
})
