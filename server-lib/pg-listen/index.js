const pg = require('pg');

const config = require('config');

const dbConfig = require('../../db/config')[config.get('NODE_ENV')];

const { logger } = require('../../lib/logger');

const demand = require('../../lib/demand');

const { EventEmitter } = require('events');


class PGListen {

  constructor({ 
    debug = false,
    pgConfig = dbConfig, 
    persist = true,
    pgClient = pg,
    channels = [] }={}){
    this.persist = persist;
    this.debug = debug;
    this.events = new EventEmitter();
    this.channels = new Set(channels);
    this.pgClient = pgClient;
    this.pgConfig = pgConfig;
    this.connected = false;
  }

  on(channel,fn){
    this.events.on(channel,fn);
  }

  async subscribe(channel, fn) {
    this.channels.add(channel);
    this.events.on(channel,fn);
    if (this.connected) await this.listen(channel);
  }

  listen(channel) {
    if (this.debug) logger.debug(`LISTEN "${channel}"`);
    return this.client.query(`LISTEN "${channel}"`);
  }

  async getChannels(){
    return (await this.client.query(`
      SELECT array_to_json(array_agg(pg_listening_channels)) 
      AS channels
      FROM pg_listening_channels()`)
    ).rows[0].channels;

  }

  disconnect(){
    this.persist = false;
    return this.client.end();
  }

  connect(retry = 0) {
    
    this.client = new this.pgClient.Client(this.pgConfig)
    this.client.connect();
    this.client.on('connect', async () => {
      retry = 0; //reset rety
      this.connected = true;
      this.events.emit('connect');
      logger.status(`PGListen connected to ${this.pgConfig.host + ""}`);
      this.channels.forEach(ch => {
        this.listen(ch);
      });
    })


    this.client.on('notification', (msg) => {
      if (this.debug) logger.debug(msg);
      const { payload, channel } = msg;
      this.events.emit(channel,payload)
    });


    this.client.on('error', async (err) => {
      //TODO: ???
      if (!this.persist) this.events.emit('error',err); 
      else logger.error(err);
    })

    this.client.on('end', async (err) => {

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
      delete this.client;
      this.connect(msExp+1);
    });

    return new Promise((rs,rx)=>{
      this.events.once('connect',rs);
      this.events.once('error',rx);
    });

  }
}


module.exports = PGListen;
