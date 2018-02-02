const { Post } = require('../../objects');
const Resource = require('../lib/resourceClass');
const BasePolicy = require('../lib/basePolicy');

class PostPolicy extends BasePolicy {


  static scope({ model, user }){
    return model.userScoped(user);
  }

  async _accounts(user){
    const accountIds = this.user.accountIds();
    const accountMember = accountIds.includes(this.instance.AccountId);
    const accountsIGIds = await this.instance.igAccountsIds()
    return accountMember && accountsIGIds.includes(this.instance.IGAccountId);
  }

  index(){
    true
  }
  async delete(){
    return this._accounts(user);
  }

  async show(){
    return this._accounts(user);
  }

  async create(){ 
    return this._accounts(user);
  }


}


module.exports = function PostController(){
  const router = new Router();
  const resource = new Resource({ model: Post, policy: PostPolicy });

  router.get('/', resource)
  router.post('/')
  router.patch('/:id')
  router.delete('/:id')
}
