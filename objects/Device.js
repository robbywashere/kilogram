const sequelize = require('sequelize');

const {
  STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op,
} = sequelize;
const { get } = require('lodash');
const { isSuperAdmin } = require('./_helpers');

const PopDeviceQuery = `
  UPDATE 
      "Devices"
  SET 
      idle=false
  WHERE
      id in (
          SELECT
              id
          FROM
              "Devices"
          WHERE
              idle=true
          AND 
              online=true
          AND
              enabled=true
          ORDER BY 
              id asc
          FOR UPDATE SKIP LOCKED
          LIMIT 1 
      )
  RETURNING *;
`;


module.exports = {
  Name: 'Device',
  Properties: {
    online: {
      type: BOOLEAN,
      allowNull: false,
      permit: true,
    },
    enabled: {
      type: BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    idle: {
      type: BOOLEAN,
      allowNull: false,
    },
    adbId: {
      unique: true,
      allowNull: false,
      permit: true,
      type: STRING,
    },
  },
  PolicyScopes: { },
  PolicyAssert: true,
  PolicyAttributes: { all: true },
  Authorize: {
    all: isSuperAdmin,
  },
  AuthorizeInstance: {
    all: isSuperAdmin,
  },
  ScopeFunctions: true,
  Scopes: {
    enabled: { where: { enabled: true } },
    disabled: { where: { enabled: false } },
    free: { where: { idle: true, online: true, enabled: true } },
    dangling: { where: { online: false, idle: false } },
    zombies: {
      where: {
        online: true,
        idle: false,
        updatedAt: {
          [Op.lte]: sequelize.fn('NOW() - INTERVAL \'5 minutes\' --'),
        },
      },
    },
  },
  Methods: {
    setFree() {
      return this.set('idle', true).save();
    },
    enable() {
      return this.update({ enabled: true });
    },
    disable() {
      return this.update({ enabled: false });
    },
  },
  StaticMethods: {
    async popDevice() { return get((await this.$.query(PopDeviceQuery, { type: sequelize.QueryTypes.SELECT, model: this })), 0); },
    setFreeById(adbId) {
      return this.update({
        idle: true,
      }, {
        where: { adbId },
      });
    },

    async gimmeFreeOne() {
      const free = await this.free();
      return get(free, 0);
    },
    async register(ids = []) {
      const exists = (await this.findAll({
        where: {
          adbId: {
            [Op.in]: ids,
          },
        },
      })).map(d => d.adbId);

      const fIds = ids.filter(id => !exists.includes(id));
      if (fIds.length > 0) {
        newDevices = fIds.map(adbId => ({ online: true, idle: true, adbId }));
        return this.bulkCreate(newDevices, { returning: true, raw: true }).map(d => d.get('adbId'));
      }
      return [];
    },

    async syncOnline(ids = []) {
      const returning = true;
      const raw = true;
      const mapAdbIds = ([_, devices]) => devices.map(d => d.adbId);
      const nowOffline = await this.update({ online: false }, {
        raw,
        returning,
        where: {
          online: true,
          adbId: { [Op.notIn]: ids },
        },
      }).then(mapAdbIds);
      const nowOnline = await this.update({ online: true }, {
        raw,
        returning,
        where: {
          online: false,
          adbId: { [Op.in]: ids },
        },
      }).then(mapAdbIds);
      return { nowOffline, nowOnline };
    },

    async syncAll(ids = []) {
      const newDevices = await this.register(ids);
      const syncd = await this.syncOnline(ids);
      return { ...syncd, newDevices };
    },

    // TODO: For when a device disconnects in the middle of working/not { idle: true }, then comes back online
    async freeDanglingByIds(ids = []) {
      await this.update({ online: true, idle: true }, {
        where: {
          adbId: { [Op.in]: ids },
          idle: false,
          online: false,
        },
      });
    },
  },
};

