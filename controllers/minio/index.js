const { Router } = require('express');
const demand = require('../../lib/demand');

const { removeObject,
  listObjects,
  signedURL } = require('../../server-lib/minio/middlewares');


module.exports = function MinioController({ minioClient = demand('minioClient') }) {
  const router = new Router();
  router.get('/objects', listObjects({ minioClient }))
  router.delete('/objects', removeObject({ minioClient }));
  router.post('/uploads', signedURL({ minioClient }))
  return router;
}

