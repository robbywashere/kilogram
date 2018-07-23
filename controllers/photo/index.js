const { Photo } = require('../../objects');
const Resource = require('../lib/baseResource');
const AuthPolicy = require('../lib/authPolicy');
const { Router } = require('express');

class PhotoPolicy extends AuthPolicy {
  async _accounts() {
    const accountIds = this.user.accountIds();
    return accountIds.includes(this.instance.AccountId);
  }

  index() {
    return true;
  }

  destroy() {
    return this._accounts();
  }

  show() {
    return this._accounts();
  }
}

module.exports = function PhotoController() {
  const router = new Router();
  const resource = new Resource({ model: Photo, policy: PhotoPolicy });
  router.use(resource.resource());
  return router;
};
