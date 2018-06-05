const { Post } = require('../../objects');
const Resource = require('../lib/baseResource');
const AuthPolicy = require('../lib/authPolicy');
const { Router } = require('express');

class PostPolicy extends AuthPolicy {
  async _accounts() {
    const accountIds = this.user.accountIds();
    return accountIds.includes(this.instance.AccountId);
  }

  index() {
    return true;
  }
  edit() {
    return this._accounts();
  }

  destroy() {
    return this._accounts();
  }

  show() {
    return this._accounts();
  }

  create() {
    return this._accounts();
  }
}


module.exports = function PostController() {
  const router = new Router();
  const resource = new Resource({ model: Post, policy: PostPolicy });
  router.use(resource.resource());
  return router;
};
