const { User, Account } = require('../../objects');
const Resource = require('../lib/baseResource');
const BasePolicy = require('../lib/basePolicy');
const AuthPolicy = require('../lib/authPolicy');
const { Router } = require('express');

class UserPolicy extends AuthPolicy {
  index() {
    return true;
  }

  async edit() {
    return this.instance.id === user.id;
  }

  async destroy() {
    return false;
  }

  async show() {
    return true;
  }

  async create() {
    return false;
  }
}


module.exports = function UserController() {
  const router = new Router();
  const resource = new Resource({ model: User, policy: UserPolicy, scope: User.accountsScoped });

  router.get('/:id/accounts', resource.action('show', {
    include: [Account],
  }));

  router.use(resource.resource());

  return router;
};
