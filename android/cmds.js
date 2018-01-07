const exec = require('./exec');

async function adbDevices() {
  const { stdout, stderr } =  await exec.$('adb devices')
  const stdArr = stdout.split("\n");
  if ( stdArr[0].trim() !== "List of devices attached"){
    throw new Error(`Unrecognized output from 'adb devices'\n\n${e}`);
  }
  return stdArr.slice(1).map(d=>d.split(' ')[0]).filter(x=>x)
}

module.exports = { adbDevices };
