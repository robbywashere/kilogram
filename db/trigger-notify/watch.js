const PGListen = require('../../server-lib/pg-listen');

class Watcher {
  constructor({ debug, pgListenClient } = {}) {
    this.pgListenClient = pgListenClient || (new PGListen({ debug }));
  }

  watch(...args) {
    return this.on.bind(this)(...args);
  }

  on({ event }, fn) {
    return this.pgListenClient.on(event, fn);
  }

  off({ event }, fn) {
    this.pgListenClient.off(event);
  }

  subscribe({ event }, fn) {
    return this.pgListenClient.subscribe(event, fn);
  }

  unsubscribe({ event }, fn) {
    return this.pgListenClient.unsubscribe(event, fn);
  }

  disconnect() {
    return this.pgListenClient.disconnect();
  }

  connect() {
    return this.pgListenClient.connect();
  }
}

module.exports = Watcher;
