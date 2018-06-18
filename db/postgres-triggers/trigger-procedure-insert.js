
const demand = require('../../lib/demand');

const TriggerProcedureInsert =  ({ 
  watchTable = demand('watchTable'),  
  watchColumn = demand('watchColumn'),
  insertTable = demand('insertTable'),
  foreignKeys = demand('foreignKeys'),
  recordKeys = demand('recordKeys'),
  trigProcName,
  jsonField = 'body',
})=> {
  const tpName = (trigProcName) ? trigProcName : `t__${watchTable}_${insertTable}`.toLowerCase();
  const dataJsonObj = recordKeys.map((key)=> `'${key}', NEW."${key}"`).join(',');
  const foreignKeyFields = foreignKeys.map(k=>`"${k}"`).join(',');
  const foreignKeyValues = foreignKeys.map(k=>`NEW."${k}"`).join(',');

return `
CREATE OR REPLACE FUNCTION ${tpName}() RETURNS TRIGGER AS $$
DECLARE 
  data json;
  BEGIN
    data = json_build_object(${dataJsonObj},'__t','${tpName}');
    INSERT INTO "${insertTable}" ("createdAt","updatedAt",${foreignKeyFields}, "${jsonField}")
    VALUES (NOW(),NOW(),${foreignKeyValues},data);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS "${tpName}" ON "${watchTable}";
CREATE TRIGGER "${tpName}"
AFTER UPDATE OF "${watchColumn}" ON "${watchTable}"
FOR EACH ROW
  EXECUTE PROCEDURE ${tpName}();`
}

module.exports = TriggerProcedureInsert ; 


