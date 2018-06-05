const { Router } = require('express');

const { NotFound, BadRequest } = require('http-errors');

const { UserRecovery, UserInvite, User } = require('../../objects');

const emailer = require('../../server-lib/emailer');

const handler = require('../../lib/handler');

const { get } = require('lodash');


module.exports = function UserInviteRedemptionController() {
  const router = new Router();
  router.put('/', handler(async (req, res) => {
    const { key } = req.body;
    const userInvite = await UserInvite.findOne({ where: { key } });
    if (!userInvite) throw new NotFound();
    const user = await userInvite.redeem();
    if (!user.verified) {
      await user.update({ verified: true });
      return res.send({ key: user.passwordKey });
    }
    res.sendStatus(200);
  }));
  return router;
};

