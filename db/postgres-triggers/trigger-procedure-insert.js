
const demand = require('../../lib/demand');
const { Trigger } = require('./triggers');

const TriggerProcedureInsert =  ({ 
  watchTable = demand('watchTable'),  
  watchColumn = demand('watchColumn'),
  insertTable = demand('insertTable'),
  foreignKeys = demand('foreignKeys'),
  recordKeys = demand('recordKeys'),
  trigProcName,
  when = '',
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


  console.log(triggerQuery);


  return `
CREATE OR REPLACE FUNCTION ${tpName}() RETURNS TRIGGER AS $$
DECLARE 
  data json;
  BEGIN
    data = json_build_object(${dataJsonObj},'__t','${tpName}','__r','${watchTable}','__c','${watchColumn}');
    INSERT INTO "${insertTable}" ("createdAt","updatedAt",${foreignKeyFields}, "${jsonField}")
    VALUES (NOW(),NOW(),${foreignKeyValues},data);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

${triggerQuery}

`
}



module.exports = TriggerProcedureInsert ; 


