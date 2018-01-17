const { isEmpty, isPlainObject, transform  } = require('lodash');



module.exports = function cleanDeep(object) {
  return transform(object, (result, value, key) => {
    if (Array.isArray(value) || isPlainObject(value)) {
      value = cleanDeep(value);
    }
    if (value === undefined) {
      return;
    }

    // Append when recursing arrays.
    if (Array.isArray(result)) {
      return result.push(value);
    }

    result[key] = value;
  });
}

