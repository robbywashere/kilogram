const { Account } = require('../../objects');
const Resource = require('../lib/resourceClass');
const BasePolicy = require('../lib/basePolicy');
const { Router }  = require('express');

class AccountPolicy extends BasePolicy {

  static scope({ model, user }){
    return model.userScoped(user)
  }

  update(){
    return this.user.isAccountRole(this.instance.id,"admin")
  }
  show(){
    return this.user.isAccountRole(this.instance.id,["admin","member"])
  }
  update(){
    return this.user.isAccountRole(this.instance.id,["admin"])
  }
  delete(){
    return false
  }
  list(){
    return true
  }

}

module.exports = function AccountController(){
  const router = new Router();
  new Resource({ model: Account, policy: AccountPolicy, scope: AccountPolicy.scope });
  return resource(Post)
}
