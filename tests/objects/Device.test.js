
const sinon = require('sinon');
const assert = require('assert');
const sync = require('../../db/sync');
const { Device } = require('../../objects');


describe('Devices', () => {
  beforeEach(async () => sync(true));

  describe('#popDevice', () => {
    it('should pop an available device', async () => {
      await Device.create({
        adbId: 'popdid',
        online: true,
        idle: true,
        enabled: true,
      });

      const device = await Device.popDevice();

      assert.equal(device.get('adbId'), 'popdid');
    });
  });


  describe('register', () => {
    it('should register new devices given a set of ids', async () => {
      const oldDevice = await Device.create({
        adbId: 'did',
        online: true,
        idle: true,
        enabled: true,
      });

      await Device.register(['did']); // Doesn't throw an error

      await Device.register(['did2']);

      const newDevice = await Device.find({ where: { adbId: 'did2' } });

      assert.notEqual(newDevice.id, oldDevice.id);

      assert.equal(newDevice.adbId, 'did2');

      assert(newDevice.online);

      assert(newDevice.idle);
    });
  });

  describe('enabled and disabled', () => {
    it(` - should disable and enable a device via the disable and enable method
       - should return disabled and enabled devices
  `, async () => {
        const d = await Device.create({
          online: false,
          idle: false,
          adbId: 'did',
          enabled: false,
        });

        assert.equal(d.enabled, false);

        await d.enable();

        assert.equal(d.enabled, true);

        assert.deepEqual('did', (await Device.enabled())[0].get('adbId'));

        await d.disable();

        assert.equal(d.enabled, false);

        assert.deepEqual([], (await Device.enabled()));

        assert.deepEqual('did', (await Device.disabled())[0].get('adbId'));
      });
  });

  describe('freeDangling by ids', () => {
    it('should `free` devices where online:false, idle:false given a list of ids', async () => {
      await Device.create({
        online: false,
        idle: false,
        adbId: 'did',
        enabled: true,
      });
      await Device.freeDanglingByIds(['did']);
      const freed = await Device.findAll({ where: { online: true, idle: true } });

      assert.equal(1, freed.length);
    });
  });

  describe('free', () => {
    it('should return devices which are free - online: true, idle: true', async () => {
      await Device.create({
        online: true,
        idle: true,
        adbId: 'freeDevice',
        enabled: true,
      });
      const freeDevices = await Device.free();
      assert.equal(freeDevices[0].adbId, 'freeDevice');
    });
  });

  describe('zombies', () => {
    it('should report devices online:true, idle: false, updated more than 5 minutes ago', async () => {
      // Thanks to : https://github.com/sequelize/sequelize/issues/3759
      //
      const d = new Device({ idle: false, online: true, adbId: 'zombie' });

      const minutes = 5;

      const timeAgo = new Date((new Date()).getTime() - (minutes + 1) * 60000);
      const cutOff = new Date((new Date()).getTime() - (minutes) * 60000);
      assert(timeAgo < cutOff); // Sanity checking

      d.set({
        updatedAt: timeAgo,
      }, { raw: true });

      d.changed('updatedAt', true);

      await d.save({
        silent: true,
        fields: ['updatedAt', 'idle', 'online', 'adbId'],
      });

      const zombies = await Device.zombies();


      assert.equal(1, zombies.length);
      assert.equal(true, zombies[0].online);
      assert.equal(false, zombies[0].idle);
    });
  });

  describe.skip('restore devices in locked state; where idle: false and BUT no work is being done on them', () => {


  });


  describe('syncDevices', () => {
    it('should update devices (online: true where in <adb devices ids> and (online: false where not in <adb device ids>)', async () => {
      const off = await Device.create({
        online: false,
        idle: true,
        adbId: 'id1',
        enabled: true,
      });

      const on = await Device.create({
        online: true,
        idle: false,
        adbId: 'id2',
        enabled: true,
      });

      await Device.syncOnline(['id1', 'did']);

      assert.equal(!off.online, (await Device.findById(off.id)).online);
      assert.equal(!on.online, (await Device.findById(on.id)).online);
    });
  });


  describe('syncAll', () => {
    it('should sync new devices with #register and #syncOnline, returning JSON when second argument is `true`', async () => {
      const off = await Device.create({
        online: false,
        idle: true,
        adbId: 'id1',
        enabled: true,
      });

      const on = await Device.create({
        online: true,
        idle: false,
        adbId: 'id2',
        enabled: true,
      });

      const result = await Device.syncAll(['id1', 'did']);

      assert.deepEqual(result, { nowOffline: ['id2'], nowOnline: ['id1'], newDevices: ['did'] });
    });
  });
});
