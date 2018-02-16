
const basePolicy = require('./basePolicy');
const { get } = require('lodash');
const { Forbidden, BadRequest, Unauthorized, NotFound } = require('http-errors');

module.exports = class AuthPolicy extends basePolicy {
  constructor(...args){
    super(...args);
    if (!this.user) {
      throw new Unauthorized()
    } 
    if (!get(this,'user.Accounts.length')) {
      throw new Forbidden('User is not an Account member')
    } 
  }
}
