require('../lib/handleUnhandledRejections');
require('../lib/arrayPrototypeToJSON');
const path = require('path');
const fs = require('fs');
const { isInteger } = require('lodash');
const cryptoRandomString = require('crypto-random-string');

if (!fs.existsSync(path.join(__dirname, '..', '.env')) && process.env.NODE_ENV === 'development') {
  console.error('**** \n ERROR: Cannot locate .env file! \n ***');
}
require('dotenv').config(); // eslint-disable-line import/no-extraneous-dependencies

function logLevel(level = 99) {
  const L = parseInt(level);
  if (!isInteger(L)) { throw new TypeError('Unable to parse LOG_LEVEL to integer, check configuration'); }
  return L;
}

function session_exp(minutes = 60) {
  const min = parseInt(minutes);
  if (!isInteger(min)) {
    throw new TypeError('Unable to parse minutes to integer, check configuration for SESSION_EXPIRE_MINUTES');
  }
  return Math.floor(Date.now() / 1000) + min * 60;
}

module.exports = {
  DB_ENC_KEY: process.env.DB_ENC_KEY,
  NODE_ENV: process.env.NODE_ENV,
  // TEST_IGUSERNAME: process.env.TEST_IGUSERNAME,
  // TEST_IGPASSWORD: process.env.TEST_IGPASSWORD,
  // MINIO_CONFIG: process.env.MINIO_CONFIG,
  IG_URL: process.env.IG_URL || 'https://www.instagram.com',
  PORT: process.env.PORT,
  LOG_LEVEL: logLevel(process.env.LOG_LEVEL),
  MINIO_SQS_ARN: process.env.MINIO_SQS_ARN,
  DEVICE_NODE_NAME: process.env.DEVICE_NODE_NAME,
  MINIO_PUBLIC_BUCKET: process.env.MINIO_PUBLIC_BUCKET,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
  MINIO_PORT: process.env.MINIO_PORT,
  MINIO_SECURE: process.env.MINIO_SECURE,
  MINIO_BUCKET: process.env.MINIO_BUCKET || 'uploads',
  MINIO_TMP_DIR: process.env.MINIO_TMP_DIR || '/tmp',
  APP_SECRET: process.env.APP_SECRET || cryptoRandomString(128),
  SESSION_EXPIRE: session_exp(process.env.SESSION_EXPIRE_MINUTES),
  BASE_URL: process.env.BASE_URL || 'http://localhost',
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PYTHON_PATH: process.env.PYTHON_PATH || '/usr/local/bin/python',
};
