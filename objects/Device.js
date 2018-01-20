const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');

const GetDeviceQuery =`
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
          LIMIT 1 FOR UPDATE
      )
  RETURNING *;
`


module.exports = {
  Name: 'Device',
  Properties:{
    online: {
      type: BOOLEAN,
      allowNull: false,
    },
    enabled: {
      type: BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    idle: {
      type: BOOLEAN,
      allowNull: false,
    },
    adbId: {
      allowNull: false,
      type: STRING
    },
  },
  PolicyAssert: false,
  Scopes: {
    enabled: { where: { enabled: true } },
    disabled: { where: { enabled: false } },
    free: { where: { idle: true, online: true, enabled: true }},
    dangling: { where: { online: false, idle: false } },
    zombies: { where: { 
      online: true, 
      idle: false,
      updatedAt: {
        [Op.lte] : sequelize.fn(`NOW() - INTERVAL '5 minutes' --`) 
      }
    }}
  },
  ScopeFunctions: true,
  Methods:{
    setFree() {
      return this.set('idle', true).save();
    },
    enable: function(){
      return this.update({ enabled: true })
    },
    disable: function(){
      return this.update({ enabled: false })
    },
  },
  StaticMethods: {
    popDevice: async function(){ return get((await this.$.query(GetDeviceQuery, { type: sequelize.QueryTypes.SELECT, model: this })),0) },
    setFreeById: function(adbId) {
      return this.update({ 
        idle: true,
      },{
        where: { adbId }
      })  
    },

    gimmeFreeOne: async function(){
      const free = await this.free();
      return get(free,0);
    },
    register: async function (ids = []){
      const exists = (await this.findAll({
        where: {
          adbId: {
            [Op.in]: ids
          }
        }
      })).map(d=>d.adbId)

      const fIds = ids.filter( id => !exists.includes(id));
      if (fIds.length > 0) {
        newDevices = fIds.map(adbId=>({ online: true, idle: true, adbId }))
        return this.bulkCreate(newDevices)
      } else {
        return []
      }
    },

    syncOnline: async function (ids = []){
      const returning = true;
      const raw = true;
      const mapAdbIds = ([_, x]) => x.map(d=>d.adbId)
      const nowOffline = await this.update({ online: false },{ raw, returning, where: {
        online: true,
        adbId: { [Op.notIn]: ids  }
      }}).then(mapAdbIds);
      const nowOnline = await this.update({ online: true },{ raw, returning, where: {
        online: false,
        adbId: { [Op.in]: ids }
      }}).then(mapAdbIds);
      return { nowOffline, nowOnline }
    },

    syncAll: async function( ids = []) {
      const newDevices = await this.register(ids);
      const syncd = await this.syncOnline(ids);
      return { ...syncd, newDevices }; 
    },

    //TODO: For when a device disconnects in the middle of working/not { idle: true }, then comes back online
    freeDanglingByIds: async function(ids = []){
      await this.update({ online: true, idle: true },{ 
        where: {
          adbId: { [Op.in]: ids },
          idle: false,
          online: false
        }
      });
    }
  }
}

