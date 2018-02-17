
const { Account, User, UserInvite } = require('../../objects');
const assert = require('assert');
const { ezUser, exprezz, appLogger } = require('../helpers');
const dbSync = require('../../db/sync');
const request = require('supertest');
const inviteRedemption = require('../../controllers/user/invite_redemption');
const signup = require('../../controllers/user/signup')


const recovery = require('../../controllers/user/recovery');

describe('User concerns', function(){



  beforeEach(()=>dbSync(true));


  it('should do user signup along with user verify', async function(){



    const app = exprezz();
    app.use(signup());

    const res1 = await request(app)
      .post('/new')
      .send({ 
        email: 'newuser@blah.com',
        password: 'blah'
      })

    const user = await User.findOne({
      where: 
      { email: 'newuser@blah.com' }
    })

    assert(user);
    assert(!user.verified);

    const { verifyKey } = user;

    const res2 = await request(app)
      .put('/verify')
      .send({
        verifyKey
      });

    await user.reload();

    assert(user.verified);


  })


  it('should do password recovery', async function(){

    const email = 'example@example.com';

    const user = await ezUser({ email, password: 'blah' });

    const app = exprezz();

    app.use(recovery());


    const res1 = await request(app)
      .post(`/${email}`)
      .expect(200);


    await user.reload();

    const newPass = 'blah2';

    const res2 = await request(app)
      .put('/')
      .send({ password: newPass, email, passwordKey: user.passwordKey })
      .expect(200);

    await user.reload();

    assert(user.verifyPassword(newPass))

  })


  it(`should respond do PUT '/' user invite of specified key creating a User with a password Key if one does not exist`, async function(){


    const account = await Account.create({});
    const ui = await UserInvite.create({
      email: 'x@x.com',
      AccountId: account.id,
    });

    const app = exprezz();

    app.use(inviteRedemption());

    appLogger(app);

    const res = await request(app)
      .put('/')
      .send({
        key: ui.key
      })
      .expect(200)


    const { key } = res.body;
    const user = await User.findOne({ where: { passwordKey: key } })

    assert(user);
  })

  it(`should respond do PUT '/' user invite of specified key for existing user`, async function(){


    const existingUser= await ezUser({
      email: 'existinguser@x.com',
    });


    const account = await Account.create({});
    const ui = await UserInvite.create({
      email: 'existinguser@x.com',
      AccountId: account.id,
    });

    const app = exprezz();

    app.use(inviteRedemption());

    appLogger(app);

    assert(existingUser.verified);

    const res = await request(app)
      .put('/')
      .send({
        key: ui.key
      })
      .expect(200)

    assert(!res.body.key);


  })

});
