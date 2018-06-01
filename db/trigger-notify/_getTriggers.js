const dbSync = require('../sync');
const objs = require('../../objects');

(async ()=>{
  await dbSync(false);

  const result = Object.entries(objs)
    .reduce((accum,[TableName,Obj])=>{
      if (Obj.Triggerables) {
        const columnTriggers = Object.entries(Obj.Triggerables).map(([column,{ event }])=>({
          column,
          event,
          resource: TableName,
          path: `${TableName}.Triggerables.${column}`,
        }))
        accum.TableColumnTriggers[TableName] = columnTriggers;
      }
      if (Obj.TableTriggers) {
        const tabletriggers = Object.entries(Obj.TableTriggers)
          .map( (([action,{ event }])=>({
            path: `${TableName}.TableTriggers.${action}`,
            action, 
            resource: TableName,
            event 
          }) ))

        accum.TableTriggers[TableName] = tabletriggers;
      }
      return accum;
    },{ TableTriggers:{}, TableColumnTriggers:{} })

  process.stdout.write(JSON.stringify(result,null,4));
  process.exit(0);
})();
