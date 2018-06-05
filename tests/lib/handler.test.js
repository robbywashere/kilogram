
const assert = require('assert');
const express = require('express');
const handler = require('../../lib/handler');
const sinon = require('sinon');
const request = require('supertest');


describe('lib.handler', () => {
  it('should catch error, log them, then call the next function with said error', async () => {
    const app = express();

    const middleware = async function () {
      throw new Error('TEST_ERROR');
    };

    const logger = sinon.spy();

    app.get('/', handler(middleware, logger));

    const res = await request(app)
      .get('/')
      .expect(500);

    assert.equal('TEST_ERROR', logger.getCall(0).args[0].message);
  });
});
