
const { Post, User, Device  } = require('../../objects');
const { Router } = require('express');
const express = require('express');
const bodyParser = require('body-parser');
const { exprezz, appLogger } = require('../helpers');
const request = require('supertest');
const { times } = require('lodash');
const DBSync = require('../../db/sync');
const { loadObject, initObjects, newRegistry } = require('../../server-lib/objectLoader');
const { Op, STRING, INTEGER } = require('sequelize');
const assert = require('assert');


const BaseResource = require('../../controllers/lib/baseResource');
const BasePolicy = require('../../controllers/lib/basePolicy');

const { Forbidden, BadRequest, Unauthorize, NotFound } = require('http-errors');

class AllowAllPolicy extends BasePolicy {

  index(){
    return true;
  }
  show(){
    return true;
  }
  edit(){
    return true;
  }
  create(){
    return true;
  }
  collectionCreate(){
    return true;
  }
  collectionDestroy(){
    return true;
  }
  collectionEdit(){
    return true;
  }
}


const testObj = {
  Name: 'TestObj',
  Properties:{
    foo: {
      type: STRING,
      permit: true
    },
    bar: {
      type: STRING,
    },
    UserId: {
      type: INTEGER
    }
  },
  ScopeFunctions: true, 
  Scopes: {
    'fooIsBar': { where: { foo: 'bar' } },
    userScoped: function(user) {
      return (user.admin) ? {} : { where: { UserId: user.id } }
    }
  },
  Hooks: {
  },
  Methods:{
  },
  StaticMethods: {
  },
  Init(){
  },
};


const registry = newRegistry();
loadObject(testObj,registry)
initObjects(registry);


const { TestObj } = registry.objects;

describe('class controller',function(){


  let app;
  beforeEach(async ()=>{
    await DBSync(true);


    const resource = new BaseResource({ 
      model: TestObj, 
      policy: AllowAllPolicy
    })

    const router = new Router();

    router.use(resource.resource())

    app = exprezz();

    app.use(bodyParser.json());

    app.use(router);
  })


  it(`should index with GET '/'`,async function(){

    await TestObj.create({ foo: 'bar' });

    const response = await request(app)
      .get('/')
      .expect(200);

    assert(response.body[0])
    assert.equal(response.body[0].foo, 'bar');

  });

  it(`should create new resource with POST '/'  `, async function(){

    const response = await request(app)
      .post('/')
      .send({ foo: 'foo' })
      .expect(200);

    const id = response.body.id

    const testobj = await TestObj.findById(id);

    assert.equal(testobj.foo, 'foo');

  });

  it(`should create new resources POST '/collection' `,async function(){

    const response = await request(app)
      .post('/collection')
      .send([{ foo: 'foo1' },{ foo: 'foo2'}])
      .expect(200);


    const ids = response.body.map(i=>i.id).sort();
    assert.equal(ids.length, 2)

    const tobj1 = await TestObj.findById(ids[0]);
    const tobj2 = await TestObj.findById(ids[1]);

    assert(tobj1);
    assert(tobj2);


  });


  it(` should delete resources in bulk DELETE '/collection?ids=[...]'`, async function(){

    const tobjs = await TestObj.bulkCreate([{},{},{}], { returning : true });

    const ids  = tobjs.map(i=>i.id).sort();

    assert(ids.length === 3);

    const response = await request(app)
      .delete('/collection')
      .query({ ids })

    const destroyedIds = response.body.map(i=>i.id).sort();

    assert.deepEqual(ids, destroyedIds);


  });
  it(` should return empty collection when deleting resources in bulk DELETE that do not exist'/collection?ids=[...]'`, async function(){

    const tobjs = await TestObj.bulkCreate([{},{},{}], { returning : true });

    const ids  = [99,100,101]; 

    assert(ids.length === 3);

    const response = await request(app)
      .delete('/collection')
      .query({ ids })

    assert.equal(response.body.length, 0);

  });


  it(`should patch a resource with PATCH /:id`, async function(){


    const tobj = await TestObj.create({ foo: 'first '});

    assert(tobj.id);

    const response = await request(app)
      .patch(`/${tobj.id}`)
      .send({ foo: 'second' })
      .expect(200)

    assert.equal(response.body.foo, 'second')


  })

  it(`should BULK patch resources with PATCH /?ids=[...]`, async function(){


    const tobjs = await TestObj.bulkCreate([{ foo: 'first'},{ foo: 'first'},{ foo: 'first'}], { returning: true });


    const ids = tobjs.map(to=>to.id).sort()
    assert(ids.length, 3);

    const response = await request(app)
      .patch(`/collection`)
      .query({ ids })
      .send({ foo: 'second' })
      .expect(200)

    const { body } = response;

    assert.equal(body.length, 3);

    assert.equal(body[0].foo,'second')
    assert.equal(body[1].foo,'second')
    assert.equal(body[2].foo,'second')
  })


  it(`should return empty array when BULK patch resources with PATCH with ids that do not exist /?ids=[...]`, async function(){


    const tobjs = await TestObj.bulkCreate([{ foo: 'first'},{ foo: 'first'},{ foo: 'first'}], { returning: true });


    const ids = [99,100,101] 
    assert(ids.length, 3);

    const response = await request(app)
      .patch(`/collection`)
      .query({ ids })
      .send({ foo: 'second' })
      .expect(200)

    const { body } = response;

    assert.equal(body.length, 0);
  })

  it(`should paginate 100 per page (default) resources with GET '/?page=<n>' `, async function(){

    const tobjs = await TestObj.bulkCreate(times(300,()=>({ foo: 'bar' })))

    assert(tobjs.length, 300);
    const response1 = await request(app)
      .get('/',{ page: 0 })

    assert.equal(response1.body.length,100);
    assert.equal(response1.body[0].id,1);
    assert.equal(response1.body[99].id,100);


    const response2 = await request(app)
      .get('/')
      .query({ page: 1 })


    assert.equal(response2.body.length,100);
    assert.equal(response2.body[0].id,101);
    assert.equal(response2.body[99].id,200);

    const response3 = await request(app)
      .get('/')
      .query({ page: 2 })


    assert.equal(response3.body.length,100);
    assert.equal(response3.body[0].id,201);
    assert.equal(response3.body[99].id,300);
  })


  it(`should paginate a given count as in per page( query param: count) per page resources with GET '/?page=<n>' `, async function(){

    const tobjs = await TestObj.bulkCreate(times(300,()=>({ foo: 'bar' })))

    assert(tobjs.length, 300);
    const response1 = await request(app)
      .get('/')
      .query({ page: 0, count: 50 })

    assert.equal(response1.body.length,50);
    assert.equal(response1.body[0].id,1);
    assert.equal(response1.body[49].id,50);


    const response2 = await request(app)
      .get('/')
      .query({ page: 1, count: 50 })


    assert.equal(response2.body.length,50);
    assert.equal(response2.body[0].id,51);
    assert.equal(response2.body[49].id,100);

  })


  it('should sort ASC and DESC given param: sort=<column> ',async function(){

    let count = 0; const alpha = () => 'abcdefghijklmnopqrstuvwxyz'.split('')[count++];


    const tobjs = await TestObj.bulkCreate(times(10,()=>({ foo: alpha() })))

    const response1 = await request(app)
      .get('/')
      .query({ sort: '-foo', })

    const ids = response1.body.map(i=>i.id);
    const foos = response1.body.map(i=>i.foo);

    assert.equal(ids[0],10);
    assert.equal(ids[9],1);


    const response2 = await request(app)
      .get('/')
      .query({ sort: 'id' })

    const ids2 = response2.body.map(i=>i.id);

    assert.equal(ids2[0],1);
    assert.equal(ids2[9],10);

  });


  it.skip('should sort by multiple columns');

  it(`should scope GET '/' on given ?scope=`, async function(){


    const tobj = await TestObj.create({ foo: 'bar' });
    await TestObj.create({ foo: 'fooisnotbar' });


    const response = await request(app)
      .get('/')
      .query({ scope: 'fooIsBar' })
      .expect(200);

    assert.equal(response.body.length,1);
    assert.equal(response.body[0].foo,'bar');

  })


  it('should respond to operator functions in query', async function(){

    const tobj = await TestObj.create({ foo: 'findTHISstring' });

    const response = await request(app)
      .get('/')
      .query({ $foo: { like: 'garbagetown' } })

    assert.equal(response.body.length, 0)

    const response1 = await request(app)
      .get('/')
      .query({ $foo: { regexp: '^[f]' } })

    assert.equal(response1.body.length, 1)

    const response1b = await request(app)
      .get('/')
      .query({ $foo: { regexp: '^[x]' } })

    assert.equal(response1b.body.length, 0)


    const response2 = await request(app)
      .get('/')
      .query({ $foo: { like: '%THIS%' } })
    assert.equal(response2.body.length, 1)


    const response3 = await request(app)
      .get('/')
      .query({ $foo: { in: JSON.stringify(['findTHISstring']) } })
    assert.equal(response3.body.length, 1)

    const response4 = await request(app)
      .get('/')
      .query({ $id: { in: JSON.stringify([1,2,3]) } })

    assert.equal(response4.body.length, 1)

    const response5 = await request(app)
      .get('/')
      .query({ $id: { in: JSON.stringify([4,5,6]) } })

    assert.equal(response5.body.length, 0)

  })

})

describe('controller class polcy',function(){


  class RestrictivePolicy extends BasePolicy {
    index(){
      return (this.user && !!this.user.superAdmin)
    }
  };



  it('should only allow user.superAdmin === true to index a resource', async function(){


    const resource = new BaseResource({ 
      model: TestObj, 
      policy: RestrictivePolicy
    })

    const router = new Router();

    router.use(resource.resource())

    app = exprezz();
    app2 = exprezz({ superAdmin: true });

    app.use(router);
    app2.use(router);

    await request(app)
      .get('/')
      .expect(403)

    await request(app2)
      .get('/')
      .expect(200)
  })


  it('should allow instance level checks', async function(){


    class MyResource extends BaseResource{
      show(){
        return { fooProperty: true } //returning mocked instance
      }
    }

    class MyPolicy extends BasePolicy {
      show(){
        if (this.instance.fooProperty) {
          return false;
        }
      }
    }

    const resource = new MyResource({
      model: TestObj,
      policy: MyPolicy
    }) 

    const router = new Router();

    router.use(resource.resource())

    app = exprezz();

    app.use(router);

    await request(app)
      .get('/1')
      .expect(403)

  })


});



