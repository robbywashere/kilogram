
const { get, snakeCase, isString, isUndefined, isPlainObject } = require('lodash');

function Trigger(Name,Params = {}) {


  let eventsStr = "INSERT,UPDATE,DELETE,TRUNCATE"
  const eventMap = new Set(eventsStr.split(','));

  let self = {

    Name,

    Params,

    actionPrep(actionType, preposition) {

      let [ [ action, columns ] ] = (isString(actionType)) 
        ? [ [ actionType , [ ] ] ]  
        : Object.entries(actionType);

      action = action.toUpperCase();

      preposition = preposition.toUpperCase();

      //-----

      self.Params.PrepositionAction = `${preposition} ${action}`;

      self.Params.Columns = columns;

      self.Params.Summary = preposition + " " + ((action !== "UPDATE") ? action : ("UPDATE"
        + ((columns.length) ? " OF " : "") 
        + columns.map(c=>(`"${c}"`)).join(', ')));

      return self;

    },


    table(t) {
      self.Params.Table = t;
      return self;
    },

    drop(b = false) {
      self.Params.Drop = b
      return self;
    },

    insteadOf(a) {
      self.actionPrep(a,'INSTEAD OF');
      return self;
    },

    after(a) {
      self.Params.Action = a;
      self.actionPrep(a,'AFTER');
      return self;
    },

    alias(a) {
      self.Params.Alias = a;
      return self;
    },

    when(w){
      self.Params.When = w;
      return self;
    },

    computeName(){
      const { Table, Columns, Action, PrepositionAction } = self.Params;

      return [
        snakeCase(Table),
        self.key,
        ((Columns) ? Columns.map(snakeCase).join(':') : false),
      ].filter(x=>x).join(':')
    },

    before(a) {
      self.Params.Action = a;
      self.actionPrep(a,'BEFORE');
      return self;
    },

    exec(p) {
      self.Params.Procedure = p;
      return self;
    },

    get key(){
      return snakeCase(self.Params.PrepositionAction);
    },

    get name(){
      return (self.Params.Name) ? Self.Params.Name : self.computeName();
    },

    get query(){

      let { 
        Summary, 
        Procedure, 
        Drop = false,
        Table,
        Name,
        When
      } = self.Params;

      if (isUndefined(Name)) {
        Name = self.computeName();  
      }

      return `
      ${ (Drop) ? `DROP TRIGGER IF EXISTS "${Name}" ON "${Table}";\n` : "" }\tCREATE TRIGGER "${Name}"
      ${Summary} ON "${Table}"
      ${ (When) ? When : "" } FOR EACH ROW
      EXECUTE PROCEDURE ${Procedure}('${Name}');
      `
    }
  };

  return self
}


module.exports = { Trigger };













