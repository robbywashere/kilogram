
module.exports = class BasePolicy {

  constructor({ instance, user, params }={}){
    this.params = params;
    this.instance = instance;
    this.user = user;
  }

    /*show(){
    return false;
  }

  index(){
    return false;
  }

  edit(){
    return false;
  }

  create(){
    return false;
  }

  destroy(){
    return false;
  }

  collectionCreate(){
    return false;
  }

  collectionDestroy(){
    return false;
  }

  collectionEdit(){
    return false;
  }*/

  default(){
    return false;
  }
}

