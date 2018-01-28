const { Router } = require('express');

const { NotFound, BadRequest } = require('http-errors');

const { UserRecovery, User } = require('../objects');

const emailer = require('../server-lib/emailer');

const { logger } = require('../lib/logger');

const { get } = require('lodash');

const router = new Router();

router.put('/', async (req, res, next) => {
  try {
    const { key } = req.params;
    const userInvite = await UserInvite.findOne({ where: { key }});
    if (!userInvite) throw new NotFound(); 
    const user = await userInvite.redeem();
    if (!user.verified) {
      user.update({ verified: true }); //no await is okay ;)
      return res.send({ key: user.passwordKey });
    }
    res.sendStatus(200)
  } catch(err) {
    logger.error(err);
    next(err);
  }

})

module.exports = router
