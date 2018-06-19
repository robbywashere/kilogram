
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
  const tpName = (trigProcName) ? trigProcName : `t__${watchTable}_${insertTable}`.toLowerCase();
  const rowDataMap = recordKeys.map((key)=> `'${key}', NEW."${key}"`).join(',');
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

  return `
CREATE OR REPLACE FUNCTION ${tpName}() RETURNS TRIGGER AS $$
DECLARE 
  body json;
  row_data json;
  meta json;
  prefix text;
  BEGIN

    ${ (meta) ? `meta = '${JSON.stringify(meta)}'::json;` : '' }

    ${ (prefix) ? `prefix = '${prefix}'::text;` : '' }

    IF prefix IS NOT NULL THEN
        row_data = json_build_object(prefix,json_build_object(${rowDataMap}));
    ELSE
        row_data = json_build_object(${rowDataMap});
    END IF;

    IF meta IS NOT NULL THEN
      body = json_build_object('data',row_data, 'meta', meta);
    ELSE
      body = json_build_object('data',row_data);
    END IF;


    INSERT INTO "${insertTable}" (
    "createdAt",
    "updatedAt",
    ${foreignKeyFields}, 
    ${jsonField})

    VALUES (
    NOW(),
    NOW(),
    ${foreignKeyValues},
    body);


  RETURN NEW;

END;
$$ LANGUAGE plpgsql;

${triggerQuery}

`
}



module.exports = TriggerProcedureInsert ; 


