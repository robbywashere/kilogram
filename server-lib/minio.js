const Minio = require('minio');
const s2p = require('stream-to-promise');
const uuidv4 = require('uuid/v4');
const { logger } = require('../lib/logger');
const config = require('config');
const { Router } = require('express');
const router = Router();
const get = require('lodash/get');
const Promise = require('bluebird');
const { Photo } = require('../objects');
const { chunk } = require('lodash');
const minioObj = require('../server-lib/minioObject');


const ClientConfig =  {

  endPoint: config.MINIO_ENDPOINT,
  bucket: config.MINIO_BUCKET,
  port: parseInt(config.MINIO_PORT),
  secure: (config.MINIO_SECURE !== "true") ? false : true,
  accessKey: config.S3_ACCESS_KEY,
  secretKey: config.S3_SECRET_KEY,
}



class MClient {
  constructor({ bucket = ClientConfig.bucket, region='us-east-1', config = ClientConfig, client }={}){
    this.bucket = bucket;
    this.region = region;
    this.client = (client) ? client : new Minio.Client(config);
  }

  listen({ bucket = this.bucket, client = this.client, events }){
    const listener = client.listenBucketNotification(bucket, '', '', ['s3:ObjectCreated:*','s3:ObjectRemoved:*'])
    logger.debug('Listening for s3/minio events ....')
    listener.on('notification', events)
  }

  getSignedPutObject({ name, exp = 60}) { 
    return this.client.presignedPutObject(this.bucket, name, exp)
  }

  signedURL({ bucket= this.bucket }){
    return signedURL({ bucket, client: this.client })
  }

  removeObject({ bucket = this.bucket, name }){
    
    return this.client.removeObject(bucket, name)
  }
  async listObjectsWithSURLs(){
    const objects = await s2p(this.client.listObjects(this.bucket));
    objects.forEach(o=>o.bucketName=this.bucket);
    for (let o of chunk(objects, 20)) { //<--- Fanout
      await Promise.all(o
        .map(obj => this.client
          .presignedGetObject(this.bucket, obj.name, 30)
          .then(u=>obj.url = u)));
    }
    return objects;
  }

  async newPhoto({ bucket = this.bucket}={}){
    const uuid = uuidv4();
    const name = minioObj.create('v3',{ uuid })
    return this.getSignedPutObject({ name });
  }

  init(){
    return this.createBucket().then( ()=> this.listen({ events: MClient.PhotoEvents }))
  }

  async createBucket({ bucket = this.bucket, region = this.region } = {}){
    try {
      await retryConnRefused(()=>this.client.bucketExists(bucket))
    } catch(err) {
      if (err.code === 'NoSuchBucket') {
        try {
          await this.client.makeBucket(bucket, this.region)
          return logger(`Bucket ${bucket} created successfully in ${this.region}.`)
        } catch(err) {
          if (err) logger.error(err)
        }
      } 
    }
    logger.debug(`Bucket ${bucket} exists ... Skipping`)
  }

  static PhotoEvents(){
    return MClient.Event({
      putFn: MClient.PutPhotoFn,
      delFn: MClient.DelPhotoFn
    })
  }

  static PutPhotoFn({ bucket, key }){
    return Photo.create({bucket, objectName: key });
  }
  static DelPhotoFn({ key }){
    return Photo.setDeleted(key);
  }
  static Event({
    putFn,
    delFn
  }) {
    return async (record) => {
      const key = get(record,'s3.object.key'); 
      const bucket = get(record,'s3.bucket.name'); 
      const event =  get(record,'eventName'); 
      logger.debug('Caught event: ', key, event);
      if (key) {
        try {
          if (event === "s3:ObjectCreated:Put") {
            await putFn({ bucket, record, key })
          } else if (event === "s3:ObjectRemoved:Deleted") {
            await delFn({ key })
          }
        } catch(e) {
        }
      }
    }
  }
}



async function retryConnRefused(fn, retryCount = 1) {
  try {
    await fn();
  } catch(err) {
    if (err.code === 'ECONNREFUSED') {
      if (retryCount <= 5) {
        logger(`Could not connect to MINIO storage\n* Trying again in ${retryCount*3} seconds .... Retry #:${retryCount}`) 
        await Promise.delay(retryCount*3*1000);
        return retryConnRefused(fn, retryCount+1);
      }
      else {
        throw new Error(`Could not connect to MINIO storage\n* Confirm minio is installed and running.\nTry: $>npm run minio:up \n* refer to README.md for help`)
      }
    } else {
      throw err;
    }
  }


}


function removeObject({ client, bucket, param = 'name' }={}){
  const mc = (client) ? client: new MClient({ bucket });
  return async (req, res, next) => { 
    try {
      res.send(await mc.removeObject({ bucket, name: req.query[param] }));
    } catch(e) {
      next(e);
    }
  }

}

function listObjects({ client, bucket }={}){
  const mc = (client) ? client: new MClient({ bucket });
  return async (req, res, next) => { 
    try {
      res.send(await mc.listObjectsWithSURLs());
    } catch(e) {
      next(e);
    }
  }
}


function signedURL({ client, bucket, param = 'name' } = {}){
  const mc = (client) ? client: new MClient({ bucket });
  return async (req, res, next) => {
    try { 
      let url = await mc.newPhoto({ bucket });
      res.end(url);
    } catch(e) {
      logger.error(e);
      next(e);
    }
  }
}




function Routes({ client }) {
  const router = new Router();
  router.get('/objects', listObjects({ client }))
  router.delete('/objects', removeObject({ client, param: 'name' }));
  router.get('/uploads', signedURL({ client, param: 'name' }))
  return router;
}


module.exports = { Routes, signedURL, removeObject, retryConnRefused, MClient, ClientConfig, listObjects };
