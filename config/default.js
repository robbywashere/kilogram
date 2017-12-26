

const path = require('path');
const fs = require('fs');


if (!fs.existsSync(path.join('..','.env')) && process.env.NODE_ENV === 'development') {
  console.error(`**** \n ERROR: Cannot locate .env file! \n ***`);
}
require('dotenv').config(); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PYTHON_PATH: process.env.PYTHON_PATH || '/usr/bin/local/python',
  PORT: process.env.PORT || 3000,
};
