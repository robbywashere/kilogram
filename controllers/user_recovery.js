const { Router } = require('express');

const { NotFound, BadRequest } = require('http-errors');

const { UserRecovery, User } = require('../objects');

const emailer = require('../server-lib/emailer');

const { logger } = require('../lib/logger');

const { get } = require('lodash');

const { userRecoveryEmail } = require('../emails');

const router = new Router();

//TODO limit security
router.post('/:user_id', async (req, res, next) => {
  //TODO parseInt?

  try {
    const userId = parseInt(req.params.user_id);
    const user = await User.findById(userId)
    if (!user) throw new NotFound(); 
    const userRecovery = await UserRecovery.create({ UserId: userId });
    const email = new emailer();
    const { key } = userRecovery;
    await email.send({msg: userRecoveryEmail({ key }), to: user.email });
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
    //console.log(await UserRecovery.forKey(key.toString()))
    const userRecovery = get((await UserRecovery.forKey(key.toString())),0)
    const user = get(userRecovery, 'User');
    if (!user) throw new NotFound();
    await user.update({ password: newPassword.toString() });
    await userRecovery.destroy(); //TODO ???
    res.sendStatus(200);
  } catch(err) {
    logger.error(err);
    next(err);
  }
})

module.exports = router
