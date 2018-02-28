
const demand = require('../../lib/demand');
const bson = require('bson');
const msgpack = require('msgpack-lite');

const DELIMITER = '_';
//$-_.+!*'()

const BASS64CIPH = [['=','_'],['/','-'],['+','.']];

class bass64 {
  constructor(ciph){
    this.cin = this.createCipher(ciph);
    this.cout = this.createCipher(ciph.map(ca=>ca.reverse()));
  }
  in(str){
    return bass64.translate(str,this.cin)
  }
  out(str){
    return bass64.translate(str,this.cout)
  }
  createCipher(keys){
    let o = new Map();
    keys.forEach(([x,y])=>o.set(x,y));
    return c => (o.has(c) ? o.get(c) : c)
  }
  static translate(str, cipher) { return str.split('').map(cipher).join('') }

}

const b64 = new bass64(BASS64CIPH);
//
//
//
class v4 {
  static enc(str){
    return b64.in(str);
  }

  static dec(str){
    return new Buffer(b64.out(str), 'base64');
  }

  static parse(objectname) {
    return msgpack.decode(v4.dec(objectname));
  }
  static create(obj){
    return v4.enc(msgpack.encode(obj).toString('base64'))
  }
}



class v3 {
  static enc(str){
    return b64.in(str);
  }

  static dec(str){
    return new Buffer(b64.out(str), 'base64');
  }

  static parse(objectname) {
    const { deserialize } = new bson();
    return deserialize(v3.dec(objectname));
  }
  static create(obj){
    const { serialize } = new bson();
    return v3.enc(serialize(obj).toString('base64'))
  }
}





class v2 {
  static enc(str){
    return b64.in(new Buffer(str).toString('base64'))
  }
  static dec(str){
    return new Buffer(b64.out(str), 'base64');
  }
  static parse(objectname) {
    return JSON.parse(v2.dec(objectname));
  }
  static create(obj){
    return v2.enc(JSON.stringify(obj));
  }
}


const schemas = {
  v2,
  v3,
  v4
}

function create(version, ...args) {
  if (typeof schemas[version] === 'undefined'){
    throw new Error(`version schema ${version} does not exist`)
  }
  return `${version}${DELIMITER}${schemas[version].create(...args)}`;
}

function parse(objectname){
  const [version, name ] = objectname.split(DELIMITER);
  if (typeof schemas[version] === 'undefined'){
    throw new Error(`version schema ${version} does not exist or it is malformed objectname`)
  }
  return schemas[version].parse([].concat(name).join(DELIMITER));
}

module.exports = { ...schemas, schemas, parse, create }
