const { Router } = require('express');

const { NotFound, BadRequest } = require('http-errors');

const { User } = require('../../objects');

const emailer = require('../../server-lib/emailer');

const { get } = require('lodash');

const config = require('config');

const { userVerifyEmail } = require('../../emails');

const ourUrl = require('../../lib/ourUrl');

const { genPasswordKey } = require('../../objects/_helpers');

const querystring = require('querystring');


const requireParams = require('../lib/requireParams');

module.exports = function UserSignUpController(){
  const router = new Router();

  router.post('/new', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      requireParams(['email','password'],req.body);
      const user = await User.create({ email, password, verified: false });
      const verifyQuery = querystring.stringify({ verifyKey: user.verifyKey });
      const url = ourUrl('user_signup','verify',verifyQuery);
      const verifyEmail = new emailer();
      await verifyEmail.send({ msg: userVerifyEmail({ url }), to: user.email });
      res.sendStatus(200)
    } catch(err) {
      next(err);
    }
  });

  router.put('/verify', async (req, res, next) => {
    try {
      requireParams(['verifyKey'],req.body);
      const { verifyKey } = req.body;
      await User.update({ verified: true },{ where: { verifyKey, verified: false } });
      res.sendStatus(200)
    } catch(err) {
      next(err);
    }
  })
  return router;
}


