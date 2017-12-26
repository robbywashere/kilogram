let minioConfig = {}; 
try {
  const mc = require('../../../.minio/config.json');
  minioConfig.S3_ACCESS_KEY = mc.credential.accessKey;
  minioConfig.S3_SECRET_KEY = mc.credential.secretKey;
} catch(e) {
  console.error(e);
  console.error('Could not locate minio config using env vars');
  minioConfig.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
  minioConfig.S3_SECRET_KEY= process.env.S3_SECRET_KEY;
}

module.exports = {
  S3_ACCESS_KEY: minioConfig.S3_ACCESS_KEY,
  S3_SECRET_KEY: minioConfig.S3_SECRET_KEY,
  DB_ENC_KEY: process.env.DB_ENC_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PYTHON_PATH: process.env.PYTHON_PATH || '/usr/bin/local/python',
  PORT: process.env.PORT,
};

