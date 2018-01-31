
const cryptoRandomString = require('crypto-random-string');
const sequelize = require('sequelize');
const { Op } = sequelize;

const within24hrs  = { [Op.lte] : sequelize.fn(`NOW() - INTERVAL '24 hours' --`) }

function isSuperAdmin(user) {
  return !!(user && user.superAdmin);
}
function isLoggedIn(user){
  return !!user
}

function genPasswordKey(){
  return cryptoRandomString(32);
}

const randomKey = genPasswordKey;


module.exports = { isSuperAdmin, within24hrs, isLoggedIn, genPasswordKey, randomKey } 
