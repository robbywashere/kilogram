module.exports = function (dir,readFile = require)  { 
  return (fn) => require('fs')
      .readdirSync(dir)
      .filter(file => !/^\.|^_|index.js/.test(file))
      .map((file) => fn(require(`${dir}/${file}`)));
}
