
module.exports = class BasePolicy {

  constructor({ instance, user }){
    this.instance = instance;
    this.user = user;
  }

  static scope({ user, model }){
    return model
  }

  show(){
    return true;
  }

  index(){
    return true;
  }

  edit(){
    return true;
  }

  create(){
    return true;
  }

  destroy(){
    return true;
  }

  default(){
    return true;
  }
}

