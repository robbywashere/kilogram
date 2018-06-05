const config = require('config');
const slurpDir = require('../../lib/slurpDir')(`${__dirname}`);
const Sequelize = require('sequelize');
const { writeFile } = require('fs');
const DB = require('../index');
const sync = require('../sync');
const { join } = require('path');
const Promise = require('bluebird');
const util = require('util');

const NEW_SEED = `
module.exports = {
  up: async ($, Sequelize) => {
  },

  down: async ($, Sequelize) => {
  }
};
`;

function seed(action) {
  return sync(false).then(() => Promise.all(slurpDir(seed => seed[action](DB.queryInterface, Sequelize))));
}

function up() {
  return seed('up');
}

function create(n) {
  if (typeof n !== 'string') {
    throw new Error(`Must provide a valid name for seed! \ngot:${n}`);
  }

  const name = n.replace(' ', '-').toLowerCase();
  const filepath = join(__dirname, `${name}-${(new Date()).getTime()}.js`);
  return util.promisify(writeFile)(filepath, NEW_SEED);
}

function down() {
  return seed('down');
}

module.exports = { up, down, create };
