const sequelize = require('sequelize');
const cmds = require('../android/cmds');
const demand = require('../lib/demand');
const config = require('config');

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

const PopNodeDeviceQuery = nodeName => `
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
          AND
              "nodeName"='${nodeName}'
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
    nodeName: {
      type: STRING,
      allowNull: false,
      defaultValue() {
        return config.get('DEVICE_NODE_NAME');
      },
    },
  },
  ScopeFunctions: true,
  Scopes: {
    enabled: { where: { enabled: true } },
    disabled: { where: { enabled: false } },
    free: { where: { idle: true, online: true, enabled: true } },
    dangling: { where: { online: false, idle: false } },
    danglingIds(ids = demand('adbIds')) {
      return ({ where: { 
        online: false, 
        adbId: { [Op.in]: ids },
        idle: false 
      } 
      }) 
    }, 
    inProgress: { where: { online: true, enabled: true, idle: false } },
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
    isInProgress(){
      return (this.online && this.enabled && !this.idle)
    },
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
    async syncDevices() {
      const devs = await cmds.adbDevices();
      await this.freeDanglingByIds(devs);
      return this.syncAll(devs);
    },
    async popDevice() { return get((await this.sequelize.query(PopDeviceQuery, { type: sequelize.QueryTypes.SELECT, model: this })), 0); },

    async popNodeDevice(nodeName) { return get((await this.sequelize.query(PopNodeDeviceQuery(nodeName), { type: sequelize.QueryTypes.SELECT, model: this })), 0); },
    setFreeById(adbId) {
      return this.update({
        idle: true,
      }, {
        where: { adbId },
      });
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
        const newDevices = fIds.map(adbId => ({ online: true, idle: true, adbId }));
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
    // Remove this? 6/15/2018
    async freeDanglingByIds(ids = demand('adbId<Array>')) {
      await this.danglingIdsFn(ids).update({ online: true, idle: true })
    },
  },
};

