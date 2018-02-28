
const basePolicy = require('./basePolicy');
const { get } = require('lodash');
const { Forbidden, Unauthorized } = require('http-errors');
const { logger } = require('../../lib/logger');

module.exports = class AuthPolicy extends basePolicy {
  /*constructor(...args){
    super(...args);
    if (!this.user) {
      throw new Unauthorized()
    } 
    if (!get(this,'user.Accounts.length')) {
      throw new Forbidden('User is not an Account member');    } 
  }*/
  static authorizeRequest({ user }){
    if (!user) {
      throw new Unauthorized();
    } 
    if (!get(user,'Accounts.length')) {
      throw new Forbidden('User is not an Account member');    
    } 
  }
}
