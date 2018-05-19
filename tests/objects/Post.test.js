

const { Account, IGAccount, PostJob, Post, Photo, User } = require('../../objects');

const ObjectRegistry = require('../../objects');

const sinon = require('sinon');
const assert = require('assert');
const sequelize = require('sequelize');
const sync = require('../../db/sync');
const SEQ = require('../../db');
const Promise = require('bluebird');
const { initJob, ezUser, newIGAccount, ezUserAccount, createUserPostJob, createAccountUserPost, createAccountUserPostJob  } = require('../helpers');
const { logger } = require('../../lib/logger');
const { zipObject, startCase, constant, times } = require('lodash');

describe('objects/Post', function(){

  beforeEach(async ()=> {
    return await sync(true);
  });



  it('should find due posts with .due', async function(){


    const { post } = await createAccountUserPost();

    await initJob(post);

    const pd = await Post.due();

    assert(pd);

  });

  it ('should respond to reloadWithJob withJob with .Job object', async function(){
    const { post } = await createAccountUserPostJob();
    post.reloadWithJob();
    assert(post.PostJob);
  })



  it.skip('should respond to withUserForId with .User object', async function(){
    const { post } = await createAccountUserPostJob();

    let p = await Post.withUsersForId(post.id)
    assert(p.User);
  })

});
