const { logger } = require('../lib/logger');
const { Router } = require('express');

const { ensureLoggedIn } = require('./_helpers');

const { NotFound } = require('http-errors');


module.exports = function(Resource){

  if (typeof Resource.userScoped !== "function") {
    throw new Error(`Failure to initialize resource, missing 'userScoped' scope definition`);
  }

  const router = new Router();

  router.use(ensureLoggedIn);

  router.post('/new', async function(req, res, next){
    const { body, user } = req;
    try {
      const resource = await Resource.create(body)
      res.send(resource);
    } catch(e) {
      next(e);
    }
  });


  router.patch('/:id',async function(req, res, next){
    const { body, user } = req;
    try {
      const resource = await Resource.userScopedFn.update(body, { returning: true });
      if (!resource) throw new NotFound();
      res.send(resource);
    } catch(e) {
      next(e);
    }

  });

  router.get('/:id', async function(req, res, next){
    const { user } = req;
    const { id } = req.params;
    try {
      const resource = await Resource.userScopedForId(user,id);
      if (!resource) throw new NotFound();
      res.send(resource);
    } catch(e) {
      next(e);
    }
  });

  router.get('/', async function(req, res,next){
    const { user } = req;
    try {
      const resources = await Resource.userScoped(user);
      res.send(resources);
    } catch(e) {
      next(e);
    }
  });

  return router;

}
