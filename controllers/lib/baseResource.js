
const { Forbidden, BadRequest, Unauthorized, NotFound } = require('http-errors');

const demand = require('../../lib/demand')
const { logger } = require('../../lib/logger');
const { add, get, cloneDeep, isNumber, isFinite, isUndefined } = require('lodash');
const { Router } = require('express');
const { Op } = require('sequelize');
const basePolicy = require('./basePolicy');

//TODO: consider Model.setPolicy(policy) for Model.authorize() when doing include model
//
//TODO: Scope shouldn't be a function, perhaps scope should be an overridable class?

class EmptyCollection { //TODO should probably make class wrappers for everything which is returned - save()'d serialize()'d
  async save(){ return undefined }
  serialize(){
    return [];
  }
}

module.exports = class BaseResource {

  constructor({ model = demand('model'), scope = ()=>this.model, policy = demand('policy')}){

    this.model = model;
    this.scope = scope;
    this.policy = policy;
    this.sortableColumns = Object.keys(this.model.rawAttributes);
  }

  //TODO: whitelist columns based on models omit
  //TODO: whitelist allowed operators 
  static operators(query){
    const returning = Object.entries(query).reduce((p,[k,v])=>{
      if (typeof v !== 'object') return p;
      Object.entries(v).forEach(([opKey,opValue])=>{
        let parsedValue = opValue;
        try {
          parsedValue = JSON.parse(opValue); //TODO: THIS COULD BE DUMB
        } catch(e){  
          if (!(e instanceof SyntaxError)) throw e;
        }
        const opSymbol = Op[opKey]
        if (opSymbol) {
          p[k] = { ...p[k], [opSymbol] : parsedValue } 
        }
      });
      return p;
    },{})
    return returning;
  }

  static page({ offset = 0, count = 100, page = 0 } = {}) {
    offset = offset || page * count
    const limit = count;
    return  { offset, limit }
  }

  static sort(sortQuery, columns){
    if (!sortQuery) return [];
    let order = [];
    let sortParams = sortQuery.split(',');
    sortParams.forEach(function(sortParam) {
      const type = (sortParam.indexOf('-') === 0) ?  'DESC' : 'ASC'; 
      const name = sortParam.replace(/^-/,'');
      if (!columns.includes(name)) throw new BadRequest(`column '${name}' is not sortable/does not exist`);
      order.push([name, type]);
    });
    return order;
  }

  async _transport({ opts, req, res, instance }){
    await instance.save()
    res.send(instance.serialize()); 
  }

  async _transportIndex({ opts, req, res, instance }){
    const { rows, count } = instance;
    const start = opts.offset;
    const end = add(parseInt(start),(rows.length||1) - 1);
    res.set('Content-Range', `items ${start}-${end}/${count}`);
    res.set('X-Total-Count',count);
    res.send(rows.map(i=>i.serialize()))
  }


  beforeAction(req){ 
    return this.policy.authorizeRequest(req); //TODO: is this too tight of coupling?
  }

  action(name,opts={}){


    let isIndexAction = !!opts.index;
    delete opts.index;

    const instanceFn = this[name];
    if (typeof instanceFn !== "function") throw new TypeError(`Controller action '${name}' is not a function`);

    return async (req, res, next) => {

      try {


      let reqOpts = cloneDeep(opts); //TODO: no cloning, this should be newing or something

        await (opts.beforeAction || this.beforeAction.bind(this))(req); //TODO: shame
        if (typeof reqOpts  === "function") reqOpts = reqOpts(req)

        let transportFn = (isIndexAction) ? this._transportIndex : this._transport;
        let operators;

        if (isIndexAction) {

          const parsedOps = Object.entries(req.query)
            .reduce( (p,[key,value]) =>{
              if (key.substring(0,1) === '$') p[key.substring(1)] = value
              return p
            },{})


          operators = this.constructor.operators(parsedOps);
          reqOpts.where = { ...operators, ...reqOpts.where }
          const order = this.constructor.sort(req.query.sort,this.sortableColumns);
          const { limit, offset } = this.constructor.page(req.query);
          reqOpts = { ...reqOpts, limit, offset, order }
        }   



        reqOpts.scope = reqOpts.scope || this.scope;
        if (req.query.scope) {
          this.model.scope(req.query.scope); //does nothing but will throw error if scope doesn't exist
          reqOpts.scope = (user)=>this.scope(user).scope(req.query.scope); 
        }
        //this.constructor.scope(req.query.scope)

        let instance = await instanceFn.bind(this)(req,{ opts: reqOpts, req })
        const reqParams = Object.assign({ },req.params, req.body);
        const policy = new this.policy({ instance, user: req.user, params: reqParams  });
        const policyFn = (policy[name]) ? policy[name].bind(policy) : policy.default;

        if (await policyFn()) return await transportFn({ opts: reqOpts, req, res, instance });
        else throw new Forbidden();

      } catch(e) {
        if (get(e,'constructor.name') === "ClientError") {
          return next(e);
        }
        if ((e.name.substr(0,9) === 'Sequelize') || (get(e,'constructor.name') === "ClientError")) {
          return next(new BadRequest(e.message))
        } 
        logger.debug(`Controller Error in '${get(this,'constructor.name')}':`,e);
        return next(e);
      }
    }
  }

  static assertIntId(id) {
    const numId = parseInt(id);
    if (!isFinite(numId)) throw new BadRequest(`Could not parse /:id' typeof ${typeof id}, ${id}' to type Integer`)
    return numId;
  }

  static collectionWhere({ ids, opts }){
    if (!ids || !ids.length) throw new BadRequest(`No IDs provided, assumed collection: \n But missing array of ids`)
    //  const ids = header.split(',').map(id=>parseInt(id.trim()))
    return { ...opts.where, id: { [Op.in] : ids } };
  }


  resource(){
    const router = new Router();
    router.post('/collection',this.action('collectionCreate'));
    router.post('/',this.action('create'));
    router.get('/', this.action('index',{ index: true }));
    router.get('/:id', this.action('show'));
    router.patch('/collection', this.action('collectionEdit'));
    router.patch('/:id', this.action('edit'));
    router.delete('/collection',this.action('collectionDestroy'));
    router.delete('/:id',this.action('destroy'));
    return router;
  }


  async show({ user, params },{ opts }){
    const scope = opts.scope;
    const id = this.constructor.assertIntId(params.id);
    const resource = await scope(user).findById(id, opts);
    if (!resource) throw new NotFound();
    return resource;
  }

  async index({ user },{ opts }){
    const scope = opts.scope;
    return scope(user).findAndCountAll(opts);
  }

  async edit({ body, params, user }, { opts }){
    const scope = opts.scope;
    const id = this.constructor.assertIntId(params.id);
    const resource = await scope(user).findById(id, opts);
    if (!resource) throw new NotFound();
    else resource.permittedSet(body);
    return resource
  }

  async create({ body, user }, { opts }){
    const instance =  this.model.build(body, opts)
    return instance;
  }

  async collectionCreate({ headers, body }, { next }) {
    if (!Array.isArray(body)) throw new BadRequest(`Collection expects body to be of type 'Array'`) 
    const sanitizedBody = body.map(o=>this.model.sanitizeParams(o));
    let result;
    sanitizedBody.save = async () => result = await this.model.bulkCreate(sanitizedBody, { returning: true });
    sanitizedBody.serialize = ()=> {
      //return (get(result,1)) ?  result[1].map(i=>i.serialize()) : [];
      return result.map(i=>i.serialize());
    }
    return sanitizedBody;
  }


  async collectionDestroy({ headers, body, user, query }, { opts }) {

    const scope = opts.scope;
    const where = this.constructor.collectionWhere({ ids: query.ids, opts })

    const instances = await scope(user).findAll({ where });

    if (!instances.length) return new EmptyCollection();

    const whereIds = { where: { id: { [Op.in]: instances.map(i=>i.id) } } };

    let result;

    instances.save = async ()=> result = await this.model.destroy({ ...whereIds });
    instances.serialize = ()=> {
      return instances.map(i=>({id: i.serialize().id }));
    }
    return instances;
  }

  async collectionEdit({ headers, body, user, query }, { opts }) {
    const scope = opts.scope;
    const where = this.constructor.collectionWhere({ ids: query.ids, opts })
    const instances = await scope(user).findAll({ where });
    if (!instances.length) return new EmptyCollection();
    const whereIds = { where: { id: { [Op.in]: instances.map(i=>i.id) } } };
    const sanitizedBody = this.model.sanitizeParams(body);
    let result;
    instances.save = async ()=> result = await this.model.update(sanitizedBody, { ...whereIds, returning: true });
    instances.serialize = ()=> (get(result,1)) ?  result[1].map(i=>i.serialize()) : [];
    return instances;
  }

  async destroy({ user, params }, { opts }){
    const scope = opts.scope;
    const resource = await scope(user).findById(params.id, opts);
    if (!instances.length) return new EmptyCollection();
    resource.save = resource.destroy;
    return resource;
  }

}


