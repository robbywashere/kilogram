const { User } = require('../../objects');
const resource = require('../_resource');
module.exports = function UserController(){
  return resource(User)
}
