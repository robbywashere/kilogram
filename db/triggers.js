
const TriggerColumnQuery = ({ name, table, column, procedure, actions }) =>  {
  actions = [].concat(actions.join(','));
  return `
    DROP TRIGGER IF EXISTS ${name} ON "${table}";
    CREATE TRIGGER ${name}
      AFTER ${actions} OF "${column}" ON "${table}"
      FOR EACH ROW
      WHEN (OLD."${column}" IS DISTINCT FROM NEW."${column}")
      EXECUTE PROCEDURE ${procedure}('${name}');
`}

let x = TriggerColumnQuery({ name: 'igaccount_status', table: 'IGAccounts', column: 'status', procedure: 'notify_event', actions: ['UPDATE',] })

console.log(x);

module.exports = TriggerColumnQuery;
