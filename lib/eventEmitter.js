
module.exports = class EE extends require('events').EventEmitter { clearListeners(){ return this.removeAllListeners() } }
//module.exports = require('emittery');
