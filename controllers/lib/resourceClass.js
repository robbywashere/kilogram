
const { Forbidden, BadRequest, Unauthorize, NotFound } = require('http-errors');

const { logger } = require('../lib/logger');
const { get, isUndefined } = require('lodash');


class BasePolicy {

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

  default(){
    return true;
  }
}

class MustAuth extends BasePolicy{
  constructor(){
    super();
    if (!!this.user) {
      throw new Unauthorized();
    }
  }
}

//router.patch('/:id',resource.action('edit'))
//router.get('/',resource.action('index'))


class BaseResource {

  constructor({ model, scope = ()=>this.model, policy }){
    this.model = model;
    this.scope = scope;
    this.policy = policy;
  }

  action(name,opts={}){
    return async (req, res, next) => {
      try {
        //opts.limit =
        //opts.offest =
        const instance = await this[name](req,{ opts, req });
        const { user } = req;
        const policy = new this.policy({ instance, user });
        const policyFn = (policy[name]) ? policy[name].bind(policy) : policy.default;
        //TODO: move the block below to its own function
        if (await policyFn()) {
          if (instance.save) {
            res.send(await instance.save()); 
          }
          else {
            if (instance.rows){
              const { rows, count } = instance;
              let o = (typeof offset !== "undefined") ? offset : 0;
              res.set('Content-Range', `${o}-${rows.length+o}/${count}`);
              instance = rows;
            }
            res.send(instance); 
          }
        } else {
          throw new Forbidden();
        }
      } catch(e) {
        if (e instanceof TypeError || 
          e instanceof ReferenceError ||
          e instanceof RangeError
        ) {
          logger.error(e)
        }
        if (e.name === 'SequelizeValidationError') {
          next(new BadRequest(e.message))
        } else {
          next(e)
        }
      }
    }
  }

  async show({ user, params }){
    const resource = await this.scope(user).findById(params.id);
    if (!resource) throw new NotFound();
    return resource;
  }

  async index({ user },opts){
    return this.scope(user).findAndCountAll(opts);
  }

  async edit({ body, params, user }){
    const resource = await this.scope(user).findById(params.id);
    resource.set(body)
    if (!resource) throw new NotFound();
    return resource
  }

  async create({ body, user }){
    return this.model.build(body)
  }


  async destroy({ user, params }){
    const resource = await this.scope(user).findById(params.id);
    if (!resource) throw new NotFound();
    resource.save = resource.destroy;
    return resource;
  }

}


module.exports = { BaseResource, BasePolicy }
