const { logger } = require('../../lib/logger');
const demand = require('../../lib/demand');
const { get } = require('lodash');
const { BadRequest, Unauthorized } = require('http-errors');


// TODO: dont think this is even needed ?
// TODO: needs AUTH
function removeObject({ minioClient = demand('minioClient') }) {
  return async (req, res, next) => {
    try {
      const name = get(req, 'query.name');
      if (!name) throw new BadRequest('object name not specified');
      res.send(await minioClient.removeObject({ name }));
    } catch (e) {
      next(e);
    }
  };
}

// TODO: needs AUTH
function listObjects({ minioClient = demand('minioClient') }) {
  return async (req, res, next) => {
    try {
      res.send(await minioClient.listObjectsWithSURLs());
    } catch (e) {
      next(e);
    }
  };
}


function signedURL({ minioClient = demand('minioClient') }) {
  return async (req, res, next) => {
    try {
      const { AccountId } = req.body;

      if (typeof AccountId === 'undefined') throw new BadRequest('Must include AccountId:');

      if (typeof get(req, 'user.accountIds') !== 'function' || !req.user.accountIds().includes(AccountId)) throw new Unauthorized('User not authorized for given AccountId');

      const { uuid, url, objectName } = await minioClient.newPhoto({ AccountId });

      res.send({ uuid, url, objectName });
    } catch (e) {
      next(e);
    }
  };
}


module.exports = { signedURL, removeObject, listObjects };
