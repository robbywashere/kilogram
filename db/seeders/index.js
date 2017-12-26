const config = require('config');
const slurpDir = require('../../lib/slurpDir')(`${__dirname}`);
const Sequelize = require('sequelize');
const DB = require('../index');
const sync = require('../sync');
const Promise = require('bluebird');

function seed(action){
  return sync(false).then(()=> Promise.all(slurpDir( seed=> seed[action](DB.queryInterface, Sequelize))))
}

function up() {
 return seed('up');
}


function down() {
  return seed('down');
}

module.exports = { up, down };
