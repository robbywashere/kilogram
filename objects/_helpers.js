
const cryptoRandomString = require('crypto-random-string');
const sequelize = require('sequelize');
const { Op } = sequelize;

const within24hrs  = { [Op.lte] : sequelize.fn(`NOW() - INTERVAL '24 hours' --`) }


const { zipObject } = require('lodash');

function isSuperAdmin(user) {
  return !!(user && user.superAdmin);
}
function genPasswordKey(){
  return cryptoRandomString(32);
}

const deserializeObjs = denormalizeJobBody(registry, body);
const serializeObjs = function(objs){
  return Object.entries(objs).reduce( (p,[ modelName, { id } ]) => { p[modelName] = id; return p } ,{});
}

function denormalizeJobBody(objectRegistry, body) {
  let queries = [];
  // Sequelize.Utils.singuarlize if modelName does not exists!?
  for (let [modelName, id] of Object.entries(body)) {
    if (!objectRegistry[modelName]) {
      let singularModel = sequelize.Utils.singuarlize(modelName);
      if (!objectRegistry[singularModel]) throw new Error(
        `Model ${modelName} relation does not exist, cannot denormalize body ->\n ${JSON.stringify(body,null,4)}`);
      else {
        modelName = singularModel;
      }
    }
    //TODO: this is getting out of hand!
    // Sequelize.Utils.pluralize
    if (Array.isArray(id)) {
      queries.push(()=>objectRegistry[modelName].findAll({ where: { id: { [Op.in]: id } } }));
    }
    else {
      queries.push(()=>objectRegistry[modelName].findById(id));
    }


  }
  return Promise.all(queries.map(query=>query()))
    .then(resultingArray => zipObject(Object.keys(body),resultingArray));
}


const randomKey = genPasswordKey;


module.exports = { 
  deserializeObjs,
  denormalizeJobBody,
  isSuperAdmin,
  within24hrs,
  genPasswordKey,
  randomKey
} 
