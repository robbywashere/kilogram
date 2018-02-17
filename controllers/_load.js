

const { readdirSync, readFileSync, lstatSync } =require('fs');
const { get, fromPairs } = require('lodash');
const urlJoin = require('url-join');
const { join } = require('path');


function isCntrlFile(filename) {
  return (filename.substr(0,1) !== '_' &&
    filename.substr(0,1) !== '.' &&
    filename.substr(-3) === ".js")
}


function endpoint(root,path) {
  const end = (end === "index.js") ? "" : path.substring(0, path.length - 3);
  return `/${root}/${end}`;
}


function parsePaths(dir) {
  let result = [];
  const roots = readdirSync(dir) //get directories
    .filter(f=>lstatSync(join(dir, f)).isDirectory())
    .filter(f=>f !== "lib") //filter out lib dir

  roots.forEach(root=>{
    const files = readdirSync(join(dir,root))
      .filter(f=>lstatSync(join(dir,root, f)).isFile())
      .filter(isCntrlFile)
      .map(f=>({ path: join(dir,root,f), endpoint: endpoint(root, f) }))
      .forEach(ep=>result.push(ep))
  });
  return result;
}





function load({ paths, app, client, prefix= '/', requireFn = require }){
  paths.forEach( ({ path, endpoint })=>{
    const controller = requireFn(path)({ app, client });  
    if (controller.prototype.constructor.name === 'router') {
      app.use(urlJoin(prefix,endpoint), controller);
    } else {
      logger.debug(`${path} export not instance of express.Router, skipping ...`);
    } 
  })
}



module.exports = { load, parsePaths, endpoint, isCntrlFile } 
