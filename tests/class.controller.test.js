
const { Post, User, Device  } = require('../objects');
const { BaseResource, BasePolicy } = require('../controllers/_resourceClass');
const { Router } = require('express');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');
const DBSync = require('../db/sync');

const { Forbidden, BadRequest, Unauthorize, NotFound } = require('http-errors');


describe.only('class controller',function(){


  beforeEach(()=>DBSync(true))
  it.only('should', async function(){



    Device.addScope('offline',{ where: { online : true } });

    class myPolicy extends BasePolicy {
      offline(){
        return true;
      }
      index(){
        return true;
      }
      create(){
        return true;
      }
    }

    class myResource extends BaseResource {
    
      offline(args,opts) {
        return this.index(args)
      }
      create({ body }){
        return super.create({ body });
      }
    }



    const resource = new myResource({ 
      model: Device, 
      policy: myPolicy, 
      scope: ()=>Device.scope('offline') 
    })


    const router = new Router();

    const app = express();

    app.use(bodyParser.json());

    app.use(router);

    router.get('/offline',resource.action('offline'));
    router.post('/',resource.action('create'));

    app.use(function(err,req,res,next){
      res.status(err.statusCode)
      res.send({ error: err.message })
    })

    let res1 = await request(app)
      .post('/')
      .send({
        online: false,
        idle: false,
        adbId: '1234'
      })
      .expect(200)

    let res2 = await request(app)
      .post('/')
      .send({
        online: true,
        idle: false,
        adbId: '12345'
      })
      .expect(200)
    const res = await request(app)
      .get('/offline')
      .expect(200)

    console.log(res.headers)

  })

})
