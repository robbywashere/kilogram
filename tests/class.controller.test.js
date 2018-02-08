
const { Post, User, Device  } = require('../objects');
const { Router } = require('express');
const express = require('express');
const bodyParser = require('body-parser');
const { exprezz, appLogger } = require('./helpers');
const request = require('supertest');
const DBSync = require('../db/sync');

const { Forbidden, BadRequest, Unauthorize, NotFound } = require('http-errors');




const BaseResource = require('../controllers/lib/resourceClass');
const BasePolicy = require('../controllers/lib/basePolicy');

describe('class controller',function(){


  beforeEach(()=>DBSync(true))


  it(`should paginate`,function(){



  });


  it.only(`should`, async function(){


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

    }



    const resource = new myResource({ 
      model: Device, 
      policy: myPolicy, 
    })


    const router = new Router();

    router.use(resource.resource())

    const app = exprezz();



    app.use(bodyParser.json());

    app.use(router);

    //app.use(resource.action('create'))
    //app.use(resource.action('index'))

    appLogger(app);

    let res1 = await request(app)
      .post('/')
      .send({
        online: false,
        idle: false,
        adbId: '4'
      })
    await request(app)
      .post('/')
      .send({
        online: false,
        idle: false,
        adbId: '3'
      })

    await request(app)
      .post('/')
      .send({
        online: false,
        idle: false,
        adbId: '2'
      })
    await request(app)
      .post('/')
      .send({
        online: false,
        idle: false,
        adbId: 'peterandthewolf'
      })

    const time = (new Date())

    let res2 = await request(app)
      .get(`/`)
      .query({
        createdAt: {
          lte: time
        },
        count: 1,
        sort: 'id'
      })
      .expect(200)

    console.log(res2.body)
    console.log(res2.headers)

    let res3 = await request(app)
      .patch(`/`)
      .send({ online: true })
      .set('collection',[1,2,3,4])
      .expect(200)


    console.log(res3.body);

    let res4 = await request(app)
      .delete(`/`)
      .set('collection',[1,2,3,4])
      .expect(200)


    console.log(res4.body);

    let res5 = await request(app)
      .get(`/`)
      .expect(200)

    console.log(res5.body)




  })

  it.skip('should', async function(){

    const { BaseResource, BasePolicy } = require('../controllers/_resourceClass');


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
