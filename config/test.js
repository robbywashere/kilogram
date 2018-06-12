module.exports = {
  TEST_IGUSERNAME: process.env.TEST_IGUSERNAME,
  TEST_IGPASSWORD: process.env.TEST_IGPASSWORD,
  MINIO_SQS_ARN: 'arn:minio:sqs::test:postgresql',
  RUN_E2E_ON_DEVICE: (process.env.RUN_E2E_ON_DEVICE === 'true'),
  DEVICE_NODE_NAME: 'HOME1',
};
