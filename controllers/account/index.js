const { Account, UserAccount, User } = require('../../objects');
const Resource = require('../lib/baseResource');
const BasePolicy = require('../lib/basePolicy');

const { Router }  = require('express');

class AccountPolicy extends BasePolicy {


  static scope(user){
    return Account.userScopedFn(user);
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
  async addUser(){
   return await this._adminOnly();
  }
  async removeUser(){
    if (this.params.userId === this.user.id) return false;
   return await this._adminOnly();
  }

}


class AccountResource extends Resource {

  async _findUser(id, scope = User) {
    const user = scope.findById(id);
    if (!user) throw new NotFound('User not found');
    return user;
  }

  async _findAccount(user, id){
    const account = await this.scope(user).findById(id);
    if (!account) throw new NotFound('Account not found');
    return account;
  }

  async removeUser({ user, params }){
    let { id, userId } = params;
    const account = await this._findAccount(user,id);
    const removableUser = await this._findUser(userId,User.accountsScopedFn(user));
    account.save = () => account.removeUser(removableUser);
    return account;

  }

  async addUser({ user, params }){
    let { id, userId, role } = params;

    role = (role === "admin") ? "admin" : "member";

    const account = await this._findAccount(user,id);

    const additionalUser = await this._findUser(userId);

    account.save = ()=> account.addUser(additionalUser, { through: { role } });

    return account;
  }

}

module.exports = function AccountController(){
  const router = new Router();
  const resource = new AccountResource({ model: Account, policy: AccountPolicy, scope: AccountPolicy.scope });
  router.get('/', resource.action('index'))
  router.get('/:id', resource.action('show'))
  router.post('/', resource.action('create'))
  router.patch('/:id', resource.action('edit'))
  router.delete('/:id', resource.action('destroy'))
  router.post('/:id/user/:userId/:role', resource.action('addUser'))
  router.delete('/:id/user/:userId', resource.action('removeUser'))
  return router;
}
