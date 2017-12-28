function slurpDir2(dir, filter = ()=>true)  { 
  return (fn) => require('fs')
      .readdirSync(dir)
      .filter(filter)
      .sort()
      .map((file) => fn(`${dir}/${file}`));
}

function slurpFile(file) {
  return require('fs').readFileSync(file).toString();
}
function forExt(ext) {
  const extsb = ext.length * -1;
  return (name) => (name.substr(extsb) === ext);
}

module.exports = { 
  slurpDir2,
  forExt,
  slurpFile
}
