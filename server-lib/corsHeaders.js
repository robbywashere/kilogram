module.exports = function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', '*'); // TODO FIX THIS
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Range, Origin, X-Requested-With, Content-Type, Accept',
  );
  res.header(
    'Access-Control-Expose-Headers',
    'Content-Range, Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
};
