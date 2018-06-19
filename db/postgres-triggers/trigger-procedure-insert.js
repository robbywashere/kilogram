
const demand = require('../../lib/demand');
const { Trigger } = require('./triggers');

const TriggerProcedureInsert =  ({ 
  watchTable = demand('watchTable'),  
  watchColumn = demand('watchColumn'),
  insertTable = demand('insertTable'),
  meta = null,
  foreignKeys = demand('foreignKeys'),
  recordKeys = demand('recordKeys'),
  trigProcName,
  when = '',
  prefix,
  jsonField = 'body',
})=> {
  //notifications:after_update:status
  const tpName = (trigProcName) ? trigProcName : `t__${watchTable}_${insertTable}`.toLowerCase();
  const dataJsonObj = recordKeys.map((key)=> `'${key}', NEW."${key}"`).join(',');
  const foreignKeyFields = foreignKeys.map(k=>`"${k}"`).join(',');
  const foreignKeyValues = foreignKeys.map(k=>`NEW."${k}"`).join(',');


  const triggerQuery = Trigger()
    .drop(true)
    .table(watchTable)
    .alias(tpName)
    .after({ update: watchColumn })
    .when(when)
    .args(null)
    .exec(tpName).query;

  prefix = (prefix) ? `'${prefix}'` : 'TG_TABLE_NAME';

  return `
CREATE OR REPLACE FUNCTION ${tpName}() RETURNS TRIGGER AS $$
DECLARE 
  data json;
  prefix text;
  BEGIN
    prefix = ${prefix}::text;

    data = json_build_object(
    prefix,
      json_build_object(${dataJsonObj}),
    '__meta', '${JSON.stringify(meta)}'::json)
    ;

    INSERT INTO "${insertTable}" (
    "createdAt",
    "updatedAt",
    ${foreignKeyFields}, 
    ${jsonField})

    VALUES (
    NOW(),
    NOW(),
    ${foreignKeyValues},
    data);


  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

${triggerQuery}

`
}



module.exports = TriggerProcedureInsert ; 


