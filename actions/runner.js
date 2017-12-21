async function runner({ deviceId, fn, msg }) {

  let result;

  try {
    fn(device,msg);
  }

  catch(e) {
    
  }

  objects.Devices.update({ idle: true }).where({ deviceId });
}


async function getIdleDevice() {
  return objects.Devices.findOne({ where: { idle: true  } });
}
