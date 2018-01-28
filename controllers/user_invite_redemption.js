const { Router } = require('express');

const { NotFound, BadRequest } = require('http-errors');

const { UserRecovery, User } = require('../objects');

const emailer = require('../server-lib/emailer');

const { logger } = require('../lib/logger');

const handler = require('../lib/handler');

const { get } = require('lodash');

const router = new Router();

router.put('/', handler(async (req, res) => {
  const { key } = req.params;
  const userInvite = await UserInvite.findOne({ where: { key }});
  if (!userInvite) throw new NotFound(); 
  const user = await userInvite.redeem();
  if (!user.verified) {
    await user.update({ verified: true });
  }
  return res.send({ key: user.passwordKey });
  res.sendStatus(200)
}))


module.exports = router
