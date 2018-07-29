const PGListen = require('../../server-lib/pg-listen');

//TODO: eliminate this class

class Watcher extends PGListen {
  watch(...args) {
    return this.on.bind(this)(...args);
  }

  on({ event }, fn) {
    super.on(event, fn);
  }

  off({ event }, fn) {
    super.off(event);
  }

  subscribe({ event }, fn) {
    return super.subscribe(event, fn);
  }

  unsubscribe({ event }, fn) {
    return super.unsubscribe(event, fn);
  }
}

module.exports = Watcher;
