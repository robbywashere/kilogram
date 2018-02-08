const { User } = require('../../objects');
const Resource = require('../lib/resourceClass');
const BasePolicy = require('../lib/basePolicy');

class UserPolicy extends BasePolicy {


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
  const resource = new Resource({ model: User, policy: UserPolicy, scope: User.accountsScoped });

  app.use(resource.resource());

  router.get('/:id/accounts', resource.action('show',{ 
    include: [ Account ]
  }));


  return router;
}
