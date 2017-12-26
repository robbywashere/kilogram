const Minio = require('minio');
const { logger } = require('../lib/logger');
const config = require('config');
const { Router } = require('express');
const router = Router();
const Promise = require('bluebird');


function newClient(){
  return new Minio.Client({
    endPoint: config.MINIO_ENDPOINT,
    port: parseInt(config.MINIO_PORT),
    secure: (config.MINIO_SECURE !== "true") ? false : true,
    accessKey: config.S3_ACCESS_KEY,
    secretKey: config.S3_SECRET_KEY,
  })
}


async function createBucket(client, retryCount=1){
  const region = 'us-east-1';
  const bucket = config.MINIO_BUCKET;
  try {
    await client.bucketExists(bucket);
  } catch(err) {
    if (err.code === 'NoSuchBucket') {
      try {
        await client.makeBucket(bucket, region)
        return logger(`Bucket ${bucket} created successfully in ${region}.`)
      } catch(err) {
        if (err) logger.error(err)
      }
    } 
    else if (err.code === 'ECONNREFUSED') {
      if (retryCount <= 3) { 
        logger(`Could not connect to MINIO storage\n* Trying again ${retryCount*3} seconds .... Retry #:${retryCount}`) 
        await Promise.delay(retryCount*3*1000);
        return createBucket(client,retryCount+1);
      }
      logger.error(`Could not connect to MINIO storage\n* Confirm minio is installed and running.\nTry: $>npm run minio:up \n* refer to README.md for help`);
    }
    else {
      logger.error(err);
    }
    process.exit(0);
  }
  logger(`Bucket ${bucket} exists ... Skipping`)
}

function newClientAndBucket(){
  const c = newClient();
  createBucket(c);
  return c;
}

function signedURLRoute(client){
  return router.get('/signedurl', (req, res, next) => {
    client.presignedPutObject(config.MINIO_BUCKET, req.query.name, (err, url) => {
      if (err) next(err)
      res.end(url)
    })
  })

}


module.exports = { createBucket, newClient, newClientAndBucket, signedURLRoute };
