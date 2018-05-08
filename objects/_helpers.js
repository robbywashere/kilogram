
const cryptoRandomString = require('crypto-random-string');
const sequelize = require('sequelize');
const { Op } = sequelize;

const within24hrs  = { [Op.lte] : sequelize.fn(`NOW() - INTERVAL '24 hours' --`) }


const { zipObject } = require('lodash');

function isSuperAdmin(user) {
  return !!(user && user.superAdmin);
}
function isLoggedIn(user){
  return !!user
}

function genPasswordKey(){
  return cryptoRandomString(32);
}


function denormalizeJobBody(objectRegistry, body) {
  let queries = [];
  for (const [modelName, id] of Object.entries(body)) {
    if (!objectRegistry[modelName]) throw new Error(`Model ${modelName} relation does not exist, cannot denormalize body ->\n ${JSON.stringify(body,null,4)}`);
    //delaying execution until loop is finished
    queries.push(()=>objectRegistry[modelName].findById(id));
  }
  return Promise.all(queries.map(query=>query()))
    .then(resultingArray => zipObject(Object.keys(body),resultingArray));
}


const randomKey = genPasswordKey;


module.exports = { denormalizeJobBody, isSuperAdmin, within24hrs, isLoggedIn, genPasswordKey, randomKey } 
