const { MClient } = require('./');
const { logger } = require('../../lib/logger');
const { get } = require('lodash');
const { Unauthorized } = require('http-errors');


function removeObject({ client, bucket, param = 'name' }={}){
  const mc = (client) ? client: new MClient({ bucket });
  return async (req, res, next) => { 
    try {
      res.send(await mc.removeObject({ bucket, name: req.query[param] }));
    } catch(e) {
      next(e);
    }
  }

}

function listObjects({ client, bucket }={}){
  const mc = (client) ? client: new MClient({ bucket });
  return async (req, res, next) => { 
    try {
      res.send(await mc.listObjectsWithSURLs());
    } catch(e) {
      next(e);
    }
  }
}


function signedURL({ client, bucket } = {}){
  const mc = (client) ? client: new MClient({ bucket });
  return async (req, res, next) => {
    try { 
      const userId =get(req,'user.id');
      if (typeof userId === "undefined") throw new Unauthorized();
      const { uuid, url } = await mc.newPhoto({ bucket, userId });
      res.send({ uuid, url });
    } catch(e) {
      next(e);
    }
  }
}


module.exports = { signedURL, removeObject, listObjects };
