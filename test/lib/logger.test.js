const {
  getLogLevel, logger, makeLogger, setLogLevel, levels,
} = require('../../lib/logger');
const assert = require('assert');
const sinon = require('sinon');

describe('logger', () => {
  it('should set log level', () => {
    setLogLevel(99);
    assert.equal(getLogLevel(), 99);

    setLogLevel(levels.STATUS);
    assert.equal(getLogLevel(), levels.STATUS);
  });

  it('should obey log level when logging', () => {
    let spy;
    const consoleLogger = {
      log: arg => (spy = arg),
      error: arg => (spy = arg),
    };

    const myLogger = makeLogger(consoleLogger);

    setLogLevel(levels.STATUS);

    assert.equal(getLogLevel(), levels.STATUS);

    myLogger.status('VALUE');

    assert(/VALUE/.test(spy));

    myLogger.debug('NO~VALUE');

    assert(!/NO~VALUE/.test(spy));

    myLogger.error('ERROR~VALUE');

    assert(/ERROR~VALUE/.test(spy));
  });
});
