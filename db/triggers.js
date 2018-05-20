
const { get, snakeCase, isString, isUndefined, isPlainObject } = require('lodash');

function Trigger(Name,Params = {}) {

  let self = {};

  self.Params = { 
    Name, 
    ...Params 
  };

  let estr = "INSERT,UPDATE,DELETE,TRUNCATE"
  const eventMap = new Set(estr.split(','));

  self = new Object({
    ...self,
    _parseAction(eventParam, preposition){

      let paramAction; 

      if (isString(eventParam)) {
        paramAction = eventParam.toUpperCase(); 
        self.Params.PrepositionAction = paramAction;
      }

      else if (isPlainObject(eventParam)) {
        let [ event, columns ] = Object.entries(eventParam)[0];
        this.Params.Columns = columns;
        let actionEvent = event.toUpperCase();
        if (!eventMap.has(actionEvent)) {
          throw new TypeError(`Event ${actionEvent} must be ${estr}`)
        }
        self.Params.PrepositionAction = `${preposition} ${actionEvent}`;

        paramAction = (actionEvent !== "UPDATE") ? actionEvent : "UPDATE OF " + [].concat(columns)
          .map(c=>(`"${c}"`)).join(', ');
      }


      else throw new TypeError(`Event expecting a string or object { update: 'columnName '} `);

      self.Params.Summary = `${preposition} ${paramAction}`
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
      self._parseAction(a,'INSTEAD OF');
      return self;
    },

    after(a) {
      self.Params.Action = a;
      self._parseAction(a,'AFTER');
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
        snakeCase(PrepositionAction),
        ((Columns) ? Columns.map(snakeCase).join(':') : false),
      ].filter(x=>x).join(':')
    },

    before(a) {
      self.Params.Action = a;
      self._parseAction(a,'BEFORE');
      return self;
    },

    exec(p) {
      self.Params.Procedure = p;
      return self;
    },

    get name(){
      return (self.Params.Name) ? Self.Params.Name : self.computeName();
    },

    query(){

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
    ${ ((Drop) ? `DROP TRIGGER IF EXISTS "${Name}" ON "${Table}";\n` : " ") }    CREATE TRIGGER "${Name}"
      ${Summary} ON "${Table}"
      ${ (When) ? When : "" } FOR EACH ROW
      EXECUTE PROCEDURE ${Procedure}('${Name}');
      `
    }


    //WHEN (OLD."${column}" IS DISTINCT FROM NEW."${column}")

  });

  return self
}

const t = Trigger()
  .drop(true)
  .after({ 'update': ["status","carl"] })
  .table('IGAccounts')
  .exec('pg_trigger_notify_event');


const q = t.query();

console.log(q);

console.log(t.name);














