const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');

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
    enable: function(){
      return this.update({ enabled: true })
    },
    disable: function(){
      return this.update({ enabled: false })
    },
  },
  StaticMethods: {
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
      }
    },

    syncOnline: async function (ids = []){
      await this.update({ online: false },{ where: {
        adbId: { [Op.notIn]: ids  }
      }});
      await this.update({ online: true },{ where: {
        adbId: { [Op.in]: ids }
      }});
    },

    syncAll: async function( ids = []) {
      await this.register(ids);
      await this.syncOnline(ids);
    },

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

