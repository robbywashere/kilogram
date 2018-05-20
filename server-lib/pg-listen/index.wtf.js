const pg = require('pg');

const config = require('config');

const dbConfig = require('../../db/config')[config.get('NODE_ENV')];

const { logger } = require('../../lib/logger');

const demand = require('../../lib/demand');

const { get } = require('lodash');

const { EventEmitter } = require('events');

const Promise = require('bluebird');

function tryJSONParse(text){
  try { 
    return JSON.parse(text);
  } catch(e) {
    return text;
  }
}

class PGListen {

  constructor({ 
    debug = false,
    dbConfig, 
    persist = true,
    client,
    json = true, 
    channels = [] }={}){

    this.json = json;
    this.dbConfig = dbConfig;
    this.persist = persist;
    this.debug = (typeof debug === "function") 
      ? debug 
      : (debug === true) 
      ? logger.debug 
      : ()=>{};


    this.events = new EventEmitter();
    this.channels = new Set(channels);
    //    this.pgConfig = pgConfig;
    this.connected = false;

    this.Client = (client) ? client.bind(client) : pg.Client.bind(pg);

  }

  on(channel,fn){
    this.events.on(channel,fn);
  }
  off(channel){
    this.events.off(channel);
  }

  async subscribe(channel, fn) {
    this.channels.add(channel);
    this.events.on(channel,fn);
    if (this.connected) await this.listen(channel);
  }
  async unsubscribe(channel) {
    this.channels.delete(channel);
    this.events.off(channel);
    if (this.connected) await this.unlisten(channel);
  }

  registerChannels(channels){
    return Promise.map([].concat(channels), this.listen.bind(this))
  };

  listen(channel) {
    const str = `LISTEN "${channel}"`;
    this.debug(str);
    return this.client.query(str);
  }

  unlisten(channel) {
    const str = `UNLISTEN "${channel}"`;
    this.debug(str);
    return this.client.query(str);
  }
  unlistenAll() {
    const str = `UNLISTEN *`;
    this.debug(str);
    return this.client.query(str);
  }

  async getChannels(){
    return get((await this.client.query(`
      SELECT array_to_json(array_agg(pg_listening_channels)) 
      AS channels
      FROM pg_listening_channels()`)
    ),'rows[0].channels');

  }

  async disconnect(unlisten = true){
    this.persist = false;
    this.events.removeAllListeners(); //????
    return this.client.end();
  }

  connect(retry = 0) {

    this.client = new this.Client(this.dbConfig);

    this.client.connect();

    this.client.once('end', async (err) => {
      if (!this.persist) return;
      this.connected = false;
      const msExp = ((retry > 5) ? 5 : retry);
      const delayMs = (2**msExp) * 1000;
      logger.status(`
        PGListen Disconnect:
        -  Retry #: ${retry+1}
        -  Retying in ${delayMs}ms
      `)
      await new Promise(_ => setTimeout(_, delayMs));
      this.connect(msExp+1);
    });



    this.client.on('connect', async (x) => {
      retry = 0;
      this.connected = true;
      this.events.emit('connect');
      this.debug(`PGListen connected to ${get(this.client,'connectionParameters.host') + ""}`);
      this.channels.forEach(ch => {
        this.listen(ch);
      });
    })


    this.client.on('notification', (msg) => {
      this.debug(msg);
      const { payload, channel } = msg;
      this.events.emit(channel,JSON.parse(payload))
    });


    this.client.on('error', async (err) => {
      //TODO: ???
      if (!this.persist) this.events.emit('error',err); 
      else logger.error(err);
    })

    return new Promise((rs,rx)=>{
      this.events.once('connect',rs);
      this.events.once('error',rx);
    });

  }
}


module.exports = PGListen;
