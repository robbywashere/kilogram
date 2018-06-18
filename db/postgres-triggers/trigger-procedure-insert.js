
const demand = require('../../lib/demand');

const TriggerProcedureInsert =  ({ 
  watchTable = demand('watchTable'),  
  watchColumn = demand('watchColumn'),
  insertTable = demand('insertTable'),
  foreignKeys = demand('foreignKeys'),
  recordKeys = demand('recordKeys'),
  jsonField = 'body',
})=> {

  const trigProcName = `t__${watchTable}_${insertTable}`.toLowerCase();
  const dataJsonObj = recordKeys.map((key)=> `'${key}', NEW."${key}"`).join(',');
  const foreignKeyFields = foreignKeys.map(k=>`"${k}"`).join(',');
  const foreignKeyValues = foreignKeys.map(k=>`NEW."${k}"`).join(',');

return `
CREATE OR REPLACE FUNCTION ${trigProcName}() RETURNS TRIGGER AS $$
DECLARE 
  data json;
  BEGIN
    data = json_build_object(${dataJsonObj});
    INSERT INTO "${insertTable}" ("createdAt","updatedAt",${foreignKeyFields}, "${jsonField}")
    VALUES (NOW(),NOW(),${foreignKeyValues}, json_build_object('name','${trigProcName}','data', data));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS "${trigProcName}" ON "${watchTable}";
CREATE TRIGGER "${trigProcName}"
AFTER UPDATE OF "${watchColumn}" ON "${watchTable}"
FOR EACH ROW
  EXECUTE PROCEDURE ${trigProcName}();`
}


  /*
let sql =fn({
  watchTable: 'PostJobs',
  insertTable: 'Notifications',
  recordKeys: ['AccountId','PostId','status'],
  foreignKeys: ['AccountId'],
  watchColumn: 'status',
  jsonField: 'body'
})
  */
module.exports = TriggerProcedureInsert ; 


