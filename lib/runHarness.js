const { logger } = require('./logger');
const demand = require('../lib/demand');
const { EventEmitter } = require('events');
/* eslint-disable no-await-in-loop */


class Runner extends EventEmitter {
  constructor({ fn = demand('fn'), debounce = 1000 }) {
    super();
    this.fn = fn;
    this.debounce = debounce;
    this.break = false;
  }

  setBreak(b){
    this.break = b;
  }

  stop(){
    this.break = true;
  }

  async start() {
    while (!this.break) {
      const debouncer = new Promise(rs => setTimeout(rs, this.debounce));
      try {
        const result = await this.fn();
        this.emit('cycle', result);
      } catch (e) {
        this.emit('error', e);
      }
      await debouncer;
    }
    this.emit('close');
    this.removeAllListeners();
  }
}

module.exports = Runner;
