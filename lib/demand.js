module.exports = function demand(name) {
  throw new TypeError(`Argument ${name} not provided`);
};
