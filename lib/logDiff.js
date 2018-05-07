const { clone, isEqual } = require('lodash');

module.exports = (logFn = console.log) => {
  let oldStatus = {};
  return (newStatus) => {
    if (!isEqual(oldStatus,newStatus)) {
      logFn(newStatus);
    }
    oldStatus = clone(newStatus);
  }
}





