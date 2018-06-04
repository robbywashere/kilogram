
const demand = require('../../lib/demand');
const bson = require('bson');
const _ = require('lodash');
const msgpack = require('msgpack-lite');
const base64url = require('base64-url')
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

class v5 {
  static enc(str){
    return base64url.encode(str)
  }

  static dec(str){
    return base64url.decode(str)
  }

  static parse(objectname) {
    return msgpack.decode(v5.dec(objectname));
  }
  static create(obj){
    const sortedObj = _(obj).toPairs().sortBy(0).fromPairs().value();
    return v5.enc(msgpack.encode(sortedObj).toString('base64'));
  }
}



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
    return v4.enc(msgpack.encode(obj).toString('base64'));
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
  v4,
  v5
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
