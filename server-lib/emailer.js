const { logger } = require('../lib/logger');

module.exports = class Emailer {
  constructor() {

  }

  async send({ to, msg, subject, from }) {
    logger(`Sending email TO: ${to}, \n MSG: ${msg}`);
    return true;
  }
};
