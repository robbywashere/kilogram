const Minio = require('minio');
const { logger } = require('../lib/logger');
const config = require('config');
const { Router } = require('express');
const router = Router();
const get = require('lodash/get');
const Promise = require('bluebird');
const { Photo } = require('../objects');


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
      if (retryCount <= 5) { 
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

function listenBucketNotify(client){
  const bucket = config.MINIO_BUCKET;
  const listener = client.listenBucketNotification(bucket, '', '', ['s3:ObjectCreated:*'])
  listener.on('notification', async function(record) {
    const key = get(record,'s3.object.key'); 
    if (key) {
      try {
        const url = await client.presignedGetObject(bucket, key);
        const [ uuid, extension ] = key.split('.');
        await Photo.update({ uploaded: true, url },{ where: { uuid } });
      } catch (e) {
        logger.error(e);
      }
    }
  })
}

function signedURLRoute(client){
  const bucket = config.MINIO_BUCKET;

  return router.get('/signedurl', async (req, res, next) => {
    let extension = (req.query.name||'').split('.')[1];
    if (!['jpg','png','jpeg'].includes(extension)) {
      extension = 'jpg';
    }
    const photo = await Photo.create({ bucket, extension });
    client.presignedPutObject(config.MINIO_BUCKET, photo.src, 60,(err, url) => {
      if (err) next(err)
      res.end(url)
    })
  })

}


module.exports = { createBucket, newClient, listenBucketNotify, newClientAndBucket, signedURLRoute };
