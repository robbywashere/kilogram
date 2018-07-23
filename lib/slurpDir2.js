const { readdirSync, readFileSync, lstatSync } = require('fs');
const { get } = require('lodash');

function slurpDir2(dir, filter = () => true) {
  return fn =>
    readdirSync(dir)
      .filter(filter)
      .filter(file => lstatSync(`${dir}/${file}`).isFile())
      .sort()
      .map(file => fn(`${dir}/${file}`));
}

function slurpFile(file) {
  return readFileSync(file).toString();
}
function forExt(ext) {
  const extsb = ext.length * -1;
  return name => name.substr(extsb) === ext;
}

function excludeIndex(path) {
  return get(path.split('/'), 0) !== 'index.js';
}

module.exports = {
  excludeIndex,
  slurpDir2,
  forExt,
  slurpFile,
};
