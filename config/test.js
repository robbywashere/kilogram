module.exports = {
  TEST_IGUSERNAME: process.env.TEST_IGUSERNAME,
  TEST_IGPASSWORD: process.env.TEST_IGPASSWORD,
  RUN_E2E_ON_DEVICE: (process.env.RUN_E2E_ON_DEVICE === "true") ? true : false
}
