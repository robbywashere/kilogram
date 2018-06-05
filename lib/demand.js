module.exports = function demand(name) {
  throw new Error(`Argument ${name} not provided`);
};
