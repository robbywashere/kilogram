const jwt = require('express-jwt');
const Router = require('express').Router;
const config = require('config');
const jwtToken = require('jsonwebtoken');
const { Account, User } = require('../../objects');
const handler = require('../../lib/handler');
const { Unauthorized } = require('http-errors');

module.exports = function JWT(app) {
  const router = new Router();

  if (typeof app !== 'undefined') app.use(require('body-parser').json());

  router.post(
    '/auth',
    handler(async (req, res, next) => {
      const { username, password } = req.body;

      const user = await User.findOne({ where: { email: username }, include: [Account] });

      if (!user || (user && !(await user.verifyPassword(password)))) {
        throw new Unauthorized();
      }

      const { id, superAdmin, email } = user.toJSON();

      const Accounts = user.Accounts.map(A => ({ id: A.id, role: A.UserAccount.role }));

      const token = jwtToken.sign(
        {
          id,
          email,
          superAdmin,
          Accounts,
          exp: config.get('SESSION_EXPIRE'),
        },
        config.get('APP_SECRET'),
      );

      res.send({ token });
    }),
  );

  router.use(jwt({ secret: config.get('APP_SECRET') }));

  // deserialize //TODO ???
  /* router.use(async function(req, res, next){
    try {
      const user = await User.findById(req.user.id, { include: [ Account ]});
      if (!user) {
        throw new Unauthorized('User invalid/does not exist');
      }
      req.user = await user;
      next();
    } catch(e) {
      next(e);
    }
  }) */

  // Profile path
  router.get('/auth', async (req, res) => {
    const { id, email, Accounts } = req.user;
    res.send({ id, email, Accounts });
    // req.user.setPolicy('read', req.user)
    // res.send(req.user.toJSON());
  });
  return router;
};
