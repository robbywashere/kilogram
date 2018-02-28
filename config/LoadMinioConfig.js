module.exports = function LoadMinioConfig(){
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
  return minioConfig;
}
