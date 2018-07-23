const { IGAccount } = require('../../objects');
const Resource = require('../lib/baseResource');
const AuthPolicy = require('../lib/authPolicy');
const { Router } = require('express');

class IGAccountPolicy extends AuthPolicy {
  _adminOnly() {
    return this.user.isAccountRole(this.instance.id, 'admin');
  }

  _accounts() {
    const accountIds = this.user.accountIds();
    return accountIds.includes(this.instance.AccountId);
  }

  async _accountAndAdmin() {
    return this._accounts() && (await this._adminOnly());
  }

  index() {
    return true;
  }

  edit() {
    return this._accountAndAdmin();
  }

  destroy() {
    return this._accountAndAdmin();
  }

  show() {
    return this._accounts();
  }

  create() {
    return this._accounts();
  }
}

module.exports = function IGAccountController() {
  const router = new Router();
  const resource = new Resource({ model: IGAccount, policy: IGAccountPolicy });
  router.get('/verified', resource.action('index', { scope: 'verified', index: true }));
  router.use(resource.resource());
  return router;
};
