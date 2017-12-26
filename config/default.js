

const path = require('path');
const fs = require('fs');


if (!fs.existsSync(path.join('..','.env')) && process.env.NODE_ENV === 'development') {
  console.error(`**** \n ERROR: Cannot locate .env file! \n ***`);
}
require('dotenv').config(); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  DB_ENC_KEY: process.env.DB_ENC_KEY,
  NODE_ENV: process.env.NODE_ENV,
  PYTHON_PATH: process.env.PYTHON_PATH,
  PORT: process.env.PORT,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT, 
  MINIO_PORT: process.env.MINIO_PORT,
  MINIO_SECURE: process.env.MINIO_SECURE,
  MINIO_BUCKET: process.env.MINIO_BUCKET,
};
