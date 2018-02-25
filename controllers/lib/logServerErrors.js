const { get } = require('lodash');

module.exports = function(logger){
  return function(err){
    if (get(err,'statusCode') === 500 || get(err,'constructor.name') === "ServerError"){
      logger(err)
    }
  }
}
