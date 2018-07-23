const { BadRequest } = require('http-errors');

module.exports = function requireParams(props, body) {
  const missing = props.filter(k => !body[k]);
  if (missing.length > 0) {
    throw new BadRequest(`${missing.join(',')} missing from request`);
  }
};
