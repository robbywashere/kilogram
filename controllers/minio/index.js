const { Router } = require('express');
const AuthPolicy = require('../lib/authPolicy');
const demand = require('../../lib/demand');
const assertLogin = require('../lib/assertLogin');
const { BadRequest, Unauthorized } = require('http-errors');

const { removeObject, listObjects, signedURL } = require('../../server-lib/minio/middlewares');

// TODO: test assertLogin here
module.exports = function MinioController({ minioClient = demand('minioClient') }) {
  const router = new Router();
  router.use(assertLogin);
  router.get('/objects', listObjects({ minioClient }));
  router.delete('/objects', removeObject({ minioClient }));
  router.post('/url', signedURL({ minioClient }));
  return router;
};
