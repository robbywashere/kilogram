const fs = require('fs');
const { get, fromPairs } = require('lodash');
const urlJoin = require('url-join');
const path = require('path');
const { logger } = require('../lib/logger');

function isCntrlFile(filename) {
  return (
    filename.substr(0, 1) !== '_' && filename.substr(0, 1) !== '.' && filename.substr(-3) === '.js'
  );
}

function endpoint(root, path) {
  const end = path === 'index.js' ? '' : path.substring(0, path.length - 3);
  return `/${root}/${end}`;
}

function parsePaths(dir) {
  const result = [];
  const roots = fs
    .readdirSync(dir) // get directories
    .filter(f => fs.lstatSync(path.join(dir, f)).isDirectory())
    .filter(f => f !== 'lib'); // filter out lib dir

  roots.forEach((root) => {
    const files = fs
      .readdirSync(path.join(dir, root))
      .filter(f => fs.lstatSync(path.join(dir, root, f)).isFile())
      .filter(isCntrlFile)
      .map(f => ({ path: path.join(dir, root, f), endpoint: endpoint(root, f) }))
      .forEach(ep => result.push(ep));
  });
  return result;
}

function load({
  paths, app, minioClient, prefix = '/', requireFn = require,
}) {
  paths.forEach(({ path, endpoint }) => {
    const route = requireFn(path);
    const controller = route({ app, minioClient });
    const URL = urlJoin('/', prefix, endpoint);
    logger.debug(`Loading controller : ${route.name} : ${URL}`);
    if (controller.prototype.constructor.name === 'router') {
      app.use(URL, controller);
    } else {
      logger.debug(`${path} export not instance of express.Router, skipping ...`);
    }
  });
}

module.exports = {
  load,
  parsePaths,
  endpoint,
  isCntrlFile,
};
