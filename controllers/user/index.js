const { User } = require('../../objects');
const Resource = require('../lib/resourceClass');
const BasePolicy = require('../lib/basePolicy');

class UserPolicy extends BasePolicy {


  static scope({ model, user }){
    return model.accountsScoped(user);
  }

  static readAttributes({ model, user }){
    return ['email']
  }

  static writeAttributes({ user, user }){
    return ['email']
  }

  index(){
    return true;
  }
  async edit() {
    return this.instance.id === user.id;
  }

  async destroy(){
    return false; 
  }

  async show(){
    return true;
  }

  async create(){ 
    return false;
  }

}


module.exports = function UserController(){
  const router = new Router();
  const resource = new Resource({ model: User, policy: UserPolicy });
  router.get('/', resource.action('index',{ attributes: ['id','email'] } ))
  router.get('/:id', resource.action('show',{ attributes: ['id','email'] }))
  router.post('/', resource.action('create',{ attributes: ['id','email'] } ))
  router.patch('/:id', resource.action('update'))
  router.delete('/:id', resource.action('destroy'))

  /*router.get('/:id/accounts', resource.action('show',{ 
    include: [ Account ]
  }));*/


  return router;
}
