const demand = require('../lib/demand');
//const { EventEmitter } = require('events');
const EventEmitter = require('../lib/eventEmitter');

/* eslint-disable no-await-in-loop */


class Spinner extends EventEmitter {

  static create(...args){
    return (new Spinner(...args)).start();
  }
  constructor({ fn = demand('fn'), concurrent = 1, debounce = 1000 }) {
    super();
    this.fn = fn;
    this.debounce = debounce;
    this.break = false;
    this.concurrent = concurrent;
    //this.map = new Map();
  }

  setBreak(b){
    this.break = b;
  }

  stop(){
    this.break = true;
    this.once('close', ()=> this.clearListeners());
    this.emit('close');
  }

  start() {
    for (let i = 0; i < this.concurrent; i++) {
      (async ()=>{
        while (!this.break) {
          const debouncer = new Promise(rs => setTimeout(rs, this.debounce));
          try {
            const result = await this.fn();
            this.emit('resolve', result);
          } catch (e) {
            this.emit('reject', e);
          }
          finally {
            //
          }
          await debouncer;
        }
      })()
    }
    return this;
  }

}

module.exports = Spinner;
