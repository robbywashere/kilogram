const { logger } = require('../lib/logger');

module.exports = class Emailer {

  constructor(){
  
  }

  async send({ to, msg }) {
    logger(`Sending email TO: ${to}, \n MSG: ${msg}`)
    return true;
  }

}
