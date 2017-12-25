const sequelize = require('sequelize');
const { STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { get } = require('lodash');

function byAbdId(o,ids){
    o.adbId = {
      [Op.in]: ids
    };
    return o
}
function byId(o){
    o.id = {
      [Op.in]: ids
    };
    return o
}
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
  Methods:{
    enable: function(){
      return this.update({ enabled: true })
    },
    disable: function(){
      return this.update({ enabled: false })
    },
  },
  StaticMethods: {
    setFree: function(adbId) {
      return this.update({ 
        idle: true,
      },{
        where: { adbId }
      })  
    },

    disabled: function() { return this.findAll({ where: { enabled: false }}) },
    enabled: function() { return this.findAll({ where: { enabled: true }}) },

    free: function() {
      return this.findAll({ where: { idle: true, online: true, enabled: true }})
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
      return Promise.resolve();

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

    freeDangling: async function(ids = []){
      await this.update({ online: true, idle: true },{ 
        where: {
          adbId: { [Op.in]: ids },
          idle: false,
          online: false
        }
      });
    },
    dangling: function(){
      return this.findAll({
        where: {
          online: false,
          idle: false,
        }
      });
    },
    zombies: function(minutes = 5){
      return this.findAll({ where: { 
        online: true, 
        idle: false,
        updatedAt: {
          [Op.lte] : sequelize.fn(`NOW() - INTERVAL '${minutes} minutes' --`) 
        }
      }})
    }
  }
}

