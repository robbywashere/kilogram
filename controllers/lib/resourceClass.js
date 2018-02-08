
const { Forbidden, BadRequest, Unauthorize, NotFound } = require('http-errors');

const { logger } = require('../../lib/logger');
const { add, get, isUndefined } = require('lodash');
const { Router } = require('express');
const { Op } = require('sequelize');

module.exports = class BaseResource {

  constructor({ model, scope = ()=>this.model, policy }){
    this.model = model;
    this.scope = scope;
    this.policy = policy;
    this.sortableColumns =Object.keys(this.model.rawAttributes);
  }

  static operators(query){
    return Object.entries(query).reduce((p,[k,v])=>{
      if (typeof v !== 'object') return p;
      Object.entries(v).forEach(([opKey,opValue])=>{
        const opSymbol = Op[opKey]
        if (opSymbol) {
          p[k] = { ...p[k], [opSymbol] : opValue } 
        }
      });
      return p;
    },{})
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
      const type =(sortParam.indexOf('-') === 0) ?  'DESC' : 'ASC'; 
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



  action(name,opts={}){

    let isIndexAction = false;
    if (typeof opts.index !== "undefined"){
      isIndexAction = opts.index;
      delete opts.index;
    }

    const instanceFn = this[name];
    if (typeof instanceFn !== "function") throw new TypeError(`Action '${name}' is not a function`);
    return async (req, res, next) => {
      try {
        if (typeof opts  === "function") opts = opts(req)

        let instance;
        let transportFn = (isIndexAction) ? this._transportIndex : this._transport;
        let operators;

        if (isIndexAction) {
          operators = this.constructor.operators(req.query);
          opts.where = { ...operators, ...opts.where }
          const order = this.constructor.sort(req.query.sort,this.sortableColumns);
          const { limit, offset } = this.constructor.page(req.query);
          opts = { ...opts, limit, offset, order }
        }   

        instance = await instanceFn.bind(this)(req,{ opts, req })
        const policy = new this.policy({ instance, user: req.user });
        const policyFn = (policy[name]) ? policy[name].bind(policy) : policy.default;
        if (await policyFn()) {
          return await transportFn({ opts, req, res, instance })
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
        if (e.name.substr(0,6) === 'Sequel') {
          next(new BadRequest(e.message))
        } else {
          next(e)
        }
      }
    }
  }

  _collectionWhere({header, opts }){
    if (!header) throw new BadRequest(`Missing 'collection' header of comma seperated ids`)
    const ids = header.split(',').map(id=>parseInt(id.trim()))
    const where = { ...opts.where, id: { [Op.in] : ids } };
    return where;
  }


  resource(){
    const router = new Router();
    router.post('/',this.action('create'))
    router.get('/', this.action('index',{ index: true }))
    router.patch('/:id', this.action('edit'))
    router.patch('/', this.action('collectionEdit'))
    router.get('/:id', this.action('show'))
    router.delete('/:id',this.action('destroy') )
    router.delete('/',this.action('collectionDestroy') )
    return router;
  }


  async show({ user, params },{ opts }){
    const resource = await this.scope(user).findById(params.id, opts);
    if (!resource) throw new NotFound();
    return resource;
  }

  async index({ user },{ opts }){
    return this.scope(user).findAndCountAll(opts);
  }

  async edit({ body, params, user }, { opts }){
    const resource = await this.scope(user).findById(params.id, opts);
    if (!resource) throw new NotFound();
    else resource.permittedSet(body)
    return resource
  }

  async create({ body, user }, { opts }){
    return this.model.build(body, opts)
  }

  async collectionDestroy({ headers, body, user}, { opts }) {
    const where = this._collectionWhere({ header: headers.collection, opts })
    let result;
    return {
      save: async ()=> result = await this.scope(user).destroy({ where }),
      serialize: ()=> ([ result ]) 
    }
  }

  async collectionEdit({ headers, body, user}, { opts }) {
    const where = this._collectionWhere({ header: headers.collection, opts })
    let save = ()=> this.scope(user).update(this.model.sanitizeParams(body), { where });
    let result;
    return {
      save: async ()=> { result = await save(); },
      serialize: ()=> result 
    }

  }

  async destroy({ user, params }, { opts }){
    const resource = await this.scope(user).findById(params.id, opts);
    if (!resource) throw new NotFound();
    return { save: resource.destroy }
  }

}


