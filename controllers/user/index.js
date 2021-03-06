const { User, Account } = require('../../models');
const Resource = require('../lib/baseResource');
const BasePolicy = require('../lib/basePolicy');
const AuthPolicy = require('../lib/authPolicy');
const { Router } = require('express');

class UserPolicy extends AuthPolicy {
  index() {
    return true;
  }

  edit() {
    return this.instance.id === this.user.id;
  }

  destroy() {
    return false;
  }

  show() {
    return true;
  }

  create() {
    return false;
  }
}

module.exports = function UserController() {
  const router = new Router();
  const resource = new Resource({ model: User, policy: UserPolicy, scope: User.accountsScoped });

  router.get(
    '/:id/accounts',
    resource.action('show', {
      include: [Account],
    }),
  );

  router.use(resource.resource());

  return router;
};
