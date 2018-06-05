module.exports = function (obj, keys, msg = '') {
  const missing = keys.reduce((p, n) => { if (!obj[n]) { p.push(n); } return p; }, []);
  if (missing.length > 0) {
    throw new Error(`${msg}, missing ${missing.join(',')}`);
  }
};

