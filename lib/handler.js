module.exports = function (middleware, log = () => {}) {
  return async function (req, res, next) {
    try {
      await middleware(req, res);
    } catch (e) {
      log(e);
      next(e);
    }
  };
};
