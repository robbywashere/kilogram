const { Router } = require('express');
const demand = require('../../lib/demand');

const { removeObject,
  listObjects,
  signedURL } = require('../../server-lib/minio/middlewares');


module.exports = function({ client = demand('client') }) {
  const router = new Router();
  router.get('/objects', listObjects({ client }))
  router.delete('/objects', removeObject({ client }));
  router.post('/uploads', signedURL({ client }))
  return router;
}

