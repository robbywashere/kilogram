
module.exports = class BasePolicy {

  constructor({ instance, user }){
    this.instance = instance;
    this.user = user;
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

  collectionCreate(){
    return true;
  }

  collectionDestroy(){
    return true;
  }

  collectionEdit(){
    return true;
  }

  default(){
    return false;
  }
}

