const {
  NotificationRead, Account, User, Notification,
} = require('../../objects');
const sequelize = require('sequelize');

const { Op, fn, literal } = sequelize;

const assert = require('assert');
const {
  ezUser, newIGAccount, ezUserAccount, createUserPostJob, createAccountUserPost, createAccountUserPostJob,
} = require('../helpers');

const dbSync = require('../../db/sync');


describe('Notifications', () => {
  beforeEach(() => dbSync(true));

  it('Should create a notification for an Account', async () => {
    const user = await ezUserAccount();

    const notif = await Notification.create({
      AccountId: user.Accounts[0].id,
    });
  });

  it('Should mark a notification as for specific User of an Account', async () => {
    const user = await ezUserAccount();

    const notif = await Notification.create({
      title: 'notif1',
      AccountId: user.Accounts[0].id,
    });

    await notif.markAsRead(user.id);
  });


  it('should list notifications for users own account(s) only', async () => {
    const user1 = await ezUserAccount();

    const accountid = user1.Accounts[0].id;

    const user2 = await ezUser({
      email: 'user2@user2.com',
    });


    await user2.reloadWithAccounts();


    const accountid2 = user2.Accounts[0].id;

    const notif = await Notification.create({
      title: 'notif1',
      AccountId: accountid,
    });

    const notif2 = await Notification.create({
      title: 'notif2',
      AccountId: accountid,
    });

    const notif3 = await Notification.create({
      title: 'notif3',
      AccountId: accountid2,
    });


    const user2Notifs = await Notification.unread({
      UserId: user2.id,
    }, { attributes: ['id'] });


    assert.equal(user2Notifs.length, 1);

    assert.deepEqual(user2Notifs[0].id, 3);
  });

  it('Should mark a notification as for specific User of a specific Account, then be able to return unread notifications for specific user of specific account', async () => {
    const user1 = await ezUserAccount();
    const accountid = user1.Accounts[0].id;

    const user2 = await ezUser({
      email: 'user2@user2.com',
    });


    await user2.reloadWithAccounts();

    const accountid2 = user2.Accounts[0].id;

    (await Account.findById(accountid)).addUser(user2);


    const notif = await Notification.create({
      title: 'notif1',
      AccountId: accountid,
    });

    const notif2 = await Notification.create({
      title: 'notif2',
      AccountId: accountid,
    });

    const notif3 = await Notification.create({
      title: 'notif3',
      AccountId: accountid2,
    });

    // Mark As Read For User 1
    await notif.markAsRead(user1.id);

    const user1Notifs = await Notification.unread({
      AccountId: accountid, UserId: user1.id,
    });

    const user2Notifs = await Notification.unread({
      AccountId: accountid, UserId: user2.id,
    });

    // Should not contain '1', which has been read by user1
    assert.deepEqual(user1Notifs.map(un => un.id), [2]);


    // Should contain unread notfs from accountid for user2
    assert.deepEqual(user2Notifs.map(un => un.id), [1, 2]);


    const user2AllUnreadNotifs = await Notification.unread({
      UserId: user2.id,
    });
    // Should contain ALL unread notfis for User2
    assert.deepEqual(user2AllUnreadNotifs.map(un => un.id).sort(), [1, 2, 3]);

    await Notification.markAllAsRead(user2.id);


    const user2AllNotifsAfterRead = await Notification.unread({
      UserId: user2.id,
    });

    assert.deepEqual(user2AllNotifsAfterRead, []);

    assert.deepEqual((await Notification.unread({ UserId: user1.id })).map(n => n.id), [2]);
  });
});
