
const sequelize = require('sequelize');
const {  Op } = sequelize;

const createdAt  = { [Op.gte] : sequelize.fn(`NOW() - INTERVAL '24 hours' --`) }
function isSuperAdmin(user) {
  return !!user.superAdmin;
}
function isLoggedIn(user){
  return !!user
}

module.exports = { isSuperAdmin, createdAt, isLoggedIn } 
