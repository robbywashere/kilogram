const { Account, UserAccount, User } = require('../../objects');
const Resource = require('../lib/baseResource');
const BasePolicy = require('../lib/basePolicy');

const { Router }  = require('express');

class AccountPolicy extends BasePolicy {

  static scope({ model, user }){
    return model.userScoped(user)
  }

  _adminOnly(){
    return this.user.isAccountRole(this.instance.id,"admin")
  }
  update(){
    return this._adminOnly();
  }
  show(){
    return this.user.isAccountRole(this.instance.id,["admin","member"])
  }
  update(){
    return this._adminOnly();
  }
  delete(){
    return false
  }
  list(){
    return true
  }
  create(){
    return false
  }
  addUser(){
    return this._adminOnly();
  }

}


class AccountResource extends Resource {

  addUser({ user, params }){
    const { id, userId, role } = params;
    role = (role === "admin") ? "admin" : "member";
    const resource = await this.scope(user).findById(id);

    if (!resource) throw new NotFound('Account not found');

    const additionalUser = await User.findById(userId);

    if (!addiontalUser) throw new NotFound('User not found');

    account.save = ()=> account.addUser(additionalUser, { through: role });

    return resource;
  }

}

module.exports = function AccountController(){
  const router = new Router();
  new Resource({ model: Account, policy: AccountPolicy, scope: AccountPolicy.scope });
  router.get('/', resource.action('index'))
  router.get('/:id', resource.action('show'))
  router.post('/', resource.action('create'))
  router.patch('/:id', resource.action('update'))
  router.delete('/:id', resource.action('destroy'))
  router.post('/:id/user/:userId/:role', resource.action('addUser'))
}
