const { Router } = require('express');

const { NotFound, BadRequest } = require('http-errors');

const { UserRecovery, User } = require('../objects');

const emailer = require('../server-lib/emailer');

const { logger } = require('../lib/logger');

const { get } = require('lodash');

const { userRecoveryEmail } = require('../emails');

const router = new Router();

//TODO limit security
router.post('/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ where: { email } })
    if (!user) throw new NotFound(); // TODO: return res.sendStatus(200) more secure?
    const userRecovery = await UserRecovery.create({ UserId: user.id });
    const recoveryEmail = new emailer();
    const { key } = userRecovery;
    await recoveryEmail.send({ msg: userRecoveryEmail({ key }), to: user.email });
    res.sendStatus(200)
  } catch(err) {
    logger.error(err);
    next(err);
  }
})

router.put('/', async(req, res, next) => {
  try {
    const { newPassword, key } = req.body;
    if (!key || !newPassword) throw new BadRequest();
    const userRecovery = get((await UserRecovery.forKey(key.toString())),0)
    const user = get(userRecovery, 'User');
    if (!user) throw new NotFound();
    await Promise.all([
      user.update({ password: newPassword.toString() }),
      userRecovery.destroy()
    ])
    res.sendStatus(200);
  } catch(err) {
    logger.error(err);
    next(err);
  }
})

module.exports = router
