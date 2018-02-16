require('../lib/handleUnhandledRejections');
const { logger } = require('../lib/logger');
const path = require('path');
const fs = require('fs');
const cryptoRandomString = require('crypto-random-string');


if (!fs.existsSync(path.join(__dirname,'..','.env')) && process.env.NODE_ENV === 'development') {
  console.error(`**** \n ERROR: Cannot locate .env file! \n ***`);
}
require('dotenv').config(); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  DB_ENC_KEY: process.env.DB_ENC_KEY,
  NODE_ENV: process.env.NODE_ENV,
  PYTHON_PATH: process.env.PYTHON_PATH,
  PORT: process.env.PORT,
  LOG_LEVEL: parseInt(process.env.LOG_LEVEL) || 3,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT, 
  MINIO_PORT: process.env.MINIO_PORT,
  MINIO_SECURE: process.env.MINIO_SECURE,
  MINIO_BUCKET: process.env.MINIO_BUCKET || 'uploads',
  MINIO_TMP_DIR: process.env.MINIO_TMP_DIR || '/tmp',
  APP_SECRET: process.env.APP_SECRET || cryptoRandomString(128) 
};
