const Minio = require('minio');
const path = require('path');
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
const demand = require('../lib/demand');


const ClientConfig =  {
  endPoint: config.MINIO_ENDPOINT,
  bucket: config.MINIO_BUCKET,
  port: parseInt(config.MINIO_PORT),
  secure: (config.MINIO_SECURE !== "true") ? false : true,
  accessKey: config.S3_ACCESS_KEY,
  secretKey: config.S3_SECRET_KEY,
}


function WrapMinioClient(client = demand('client instance/client.prototype'), opts = {}){
  const wrapMethods = `makeBucket
  listBuckets
  bucketExists
  removeBucket
  listObjects
  listObjectsV2
  listIncompleteUploads
  fPutObject
  fGetObject
  getObject
  putObject
  copyObject
  statObject
  removeObject
  removeIncompleteUpload
  presignedGetObject
  presignedPutObject
  presignedPostPolicy
  getBucketNotification
  setBucketNotification
  removeAllBucketNotification
  getBucketPolicy
  setBucketPolicy`.split("\n").map(x=>x.trim());

    const newClient = {};
  wrapMethods.forEach(m=>{
    const wfn = client[m];
    if (typeof wfn !== "undefined") {
      newClient[m] = (...args) => retryConnRefused3({ ...opts, fn: async ()=>wfn.bind(client)(...args), debug: wfn.name });
    
    }
  })
  return newClient;

}

//WrapMinioClient(Minio.Client.prototype)

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

  async pullPhoto({ bucket = this.bucket, name }){
    try {
      const localpath = path.join(config.MINIO_TMP_DIR,name)
      await this.client.fGetObject(bucket,name,localpath)
      return localpath;
    } catch(e) {
      throw e
    }
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

  async newPhoto({ bucket = this.bucket, userId }={}){
    const uuid = uuidv4();
    const name = minioObj.create('v4',{ uuid, userId })
    return this.getSignedPutObject({ name });
  }

  init(){
    return this.createBucket().then( ()=> this.listen({ events: MClient.PhotoEvents }))
  }

  async createBucket({ bucket = this.bucket, region = this.region } = {}){
    try {
      await this.client.bucketExists(bucket)
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

async function retryConnRefused3({ fn, retryCount = 1, retryDelayFn = (retries)=>retries*3000, max = 5, debug = '' }) {
  try {
    await fn();
  } catch(err) {
    
    if (err.code === 'ECONNREFUSED' && retryCount <= max) {
      logger.debug(`Error: Connection refused, retrying ${retryCount}/${max} - ${debug}`)
      await Promise.delay(retryDelayFn(retryCount));
      return await retryConnRefused3({ fn, retryCount: retryCount+1, max, retryDelayFn, debug });
    }
    throw err;
  }
}

async function retryConnRefused2({ fn, retryCount = 1, max = 5, ms = 3000 }) {
  try {
    await fn();
  } catch(err) {
    if (err.code === 'ECONNREFUSED' && retryCount <= max) {
      await Promise.delay(retryCount*ms);
      return retryConnRefused2({ fn, retryCount: retryCount+1, max, ms });
    }
    throw err;
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


function signedURL({ client, bucket } = {}){
  const mc = (client) ? client: new MClient({ bucket });
  return async (req, res, next) => {
    try { 
      const userId = get(req,'user.id') ? req.user.id : 'USERID';
      let url = await mc.newPhoto({ bucket, userId });
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


module.exports = { Routes, WrapMinioClient, signedURL, removeObject, retryConnRefused, MClient, ClientConfig, listObjects };

/*
{ Error: connect ECONNREFUSED 127.0.0.1:9000
    at Object._errnoException (util.js:1019:11)
    at _exceptionWithHostPort (util.js:1041:20)
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1175:14)
  code: 'ECONNREFUSED',
  errno: 'ECONNREFUSED',
  syscall: 'connect',
  address: '127.0.0.1',
  port: 9000 }
  */
