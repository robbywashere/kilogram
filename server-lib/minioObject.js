
const demand = require('../lib/demand');
const bson = require('bson');

const v2 = {
  parse(objectname) {
    const { deserialize } = new bson();
    const decoded = new Buffer(objectname.replace(/_/g,'='), 'base64');
    return JSON.parse(decoded);
  },
  create(obj){
    const { serialize } = new bson();
    return new Buffer(JSON.stringify(obj)).toString('base64').replace(/=/g,'_')
  }
}

const v3 = {
  parse(objectname) {
    const { deserialize } = new bson();
    const decoded = new Buffer(objectname.replace(/_/g,'='), 'base64');
    return deserialize(decoded);
  },
  create(obj){
    const { serialize } = new bson();
    return serialize(obj).toString('base64').replace(/=/g,'_')
  }
}



const v1 = {
  parse(objectname) {
    try {
      const [ name, extension ] = objectname.split('.');
      const decoded = new Buffer(name.replace(/_/g,'='), 'base64').toString('ascii');
      const [uuid,userId, m] = decoded.split(':');
      const meta = new Buffer(m, 'base64').toString('ascii');
      if ([ uuid, userId, extension].some(x=> typeof x === "undefined")) throw new Error('error parsing');
      return { uuid, userId, meta, extension }
    } catch(e) {
      throw new Error(`Error parsing v1 obj schema\n${e}`)
    }
  },
  create(params) {
    const p = ({ 
      uuid = demand('uuid'), 
      userId = demand('userId'), 
      meta = '',
      extension = demand('extension') }) => { 
        const m = new Buffer(meta).toString('base64');
        const payload = new Buffer([uuid, userId, m].map(x=>x.toString()).join(':')).toString('base64');
        return `${payload.replace(/=/g,'_')}.${extension}`;
      }
    try {
      return p(params);
    } catch(e){
      throw new Error(`error parsing v1 obj name \n ${e}`)
    }
  }
}

const schemas = {
  v1,
  v2,
  v3,
}

function create(version, ...args) {
  if (typeof schemas[version] === "undefined"){
    throw new Error(`version schema ${version} does not exist`)
  }
  return `${version}:${schemas[version].create(...args)}`;
}

function parse(objectname){
  const [version, name] = objectname.split(':');
  if (typeof schemas[version] === "undefined"){
    throw new Error(`version schema ${version} does not exist or it is malformed objectname`)
  }
  return schemas[version].parse(name);

}

module.exports = { ...schemas, schemas, parse, create }
