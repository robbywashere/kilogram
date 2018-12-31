

const { logger } = require('../lib/logger');
const chalk = require('chalk');

process.env.NODE_ENV = 'test';
const config = require('config');

config.NODE_ENV = 'test';

const db = require('../db');

(async ()=>{
  try {
    await db.authenticate();
  } catch(e) {
    console.error(e);
    console.error(chalk.red(`Could not authenticate with DB, ensure DB instance is running`));
    process.exit(1);
  }
})()
try {
  require('child_process').execFileSync('npm', ['run', 'e:test', 'db:schema:up'], {
    stdio: 'ignore',
  });
} catch(e){
  console.error(e);
  console.error(chalk.red(`Could not run 'db:schema:up', ensure DB instance is running`));
  process.exit(1);
}

