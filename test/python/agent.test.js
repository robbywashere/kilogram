const { Agent } = require('../../android/deviceAgent');
// const IGAccount = require('../../objects/IGAccount');
const PythonShell = require('python-shell');
const sinon = require('sinon');
const assert = require('assert');

describe('class Agent', () => {
  const sandbox = sinon.sandbox.create();

  afterEach(() => {
    sandbox.restore();
  });

  it('should send an echo cmd to the python bridge', function (done) {
    this.timeout(5000);

    const agent = new Agent({ deviceId: 'adbId' });

    const bridge = agent.connect();

    agent.exec({ cmd: 'echo', args: { arg1: true } }).then((result) => {
      try {
        assert.deepEqual(result, {
          args: {
            arg1: true,
          },
          deviceId: 'adbId',
          method: 'echo',
        });
        done();
      } catch (e) {
        return done(e);
      }
    });
  });

  it('should send a testcmd to the python bridge', (done) => {
    const agent = new Agent({ deviceId: 'adbId' });

    const bridge = agent.connect();

    sandbox.stub(PythonShell.prototype, 'send').callsFake((data) => {
      try {
        assert.deepEqual(data, { deviceId: 'adbId', args: {}, method: '__testcmd__' });
      } catch (e) {
        done(e);
        throw e;
      }
    });

    agent.exec({ cmd: '__testcmd__', args: {} }).then((result) => {
      try {
        assert.deepEqual(result, { error: 'no input', success: false });
        done();
      } catch (e) {
        return done(e);
      }
    });
  });
});
