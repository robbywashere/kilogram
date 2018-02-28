module.exports = function LoadMinioConfig(minio_file_path){
  let minioConfig = {}; 
  try {
    if (!minio_file_path) throw Error();
    const mc = require(minio_file_path);
    minioConfig.S3_ACCESS_KEY = mc.credential.accessKey;
    minioConfig.S3_SECRET_KEY = mc.credential.secretKey;
  } catch(e) {
    console.warn(`No minio config, falling back to S3_ACCESS_KEY and S3_SECRET_KEY`);
    minioConfig.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
    minioConfig.S3_SECRET_KEY= process.env.S3_SECRET_KEY;
  }
  return minioConfig;
}
