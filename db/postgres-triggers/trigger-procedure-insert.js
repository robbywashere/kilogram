
const demand = require('../../lib/demand');
const { Trigger } = require('./triggers');


function prefixer(p, stmt, meta){
  if (!p || p.length === 0) return stmt + ';';
  let prefix = p.pop();
  if (meta && p.length === 0) {
    return `json_build_object('${prefix}',${stmt}, 'meta','${JSON.stringify(meta)}'::json);`;
  } else {
    return prefixer(p, `json_build_object('${prefix}',${stmt})`, meta);
  }
}

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

  let PREFIX = (typeof prefix === "string") ? prefix.split('.') : prefix; 

  let BODY = prefixer([].concat(PREFIX),`json_build_object(${rowDataMap})`,meta);

  let foreignKeyFields;
  let foreignKeyValues;
  if (foreignKeys) {
    foreignKeyFields =  foreignKeys.map(k=>`"${k}"`).join(',');
    foreignKeyValues =  foreignKeys.map(k=>`NEW."${k}"`).join(',');
  }


  const triggerQuery = Trigger()
    .drop(true)
    .table(watchTable)
    .alias(tpName)
    .after({ update: watchColumn })
    .when(when)
    .args(null)
    .exec(tpName).query;


  const fields = ['"createdAt"','"updatedAt"',jsonField,foreignKeyFields]
    .filter(x=>x).join(',');

  const values = ['NOW()','NOW()',jsonField,foreignKeyValues]
    .filter(x=>x).join(',');

  const INSERT = `"${insertTable}" (${fields})`;

  const VALUES = `(${values});`;


  return `
CREATE OR REPLACE FUNCTION ${tpName}() RETURNS TRIGGER AS $$
DECLARE 
  body json;
  row_data json;
  meta json;
  BEGIN

    body = ${BODY}

    INSERT INTO ${INSERT}

    VALUES ${VALUES}

  RETURN NEW;

END;
$$ LANGUAGE plpgsql;

${triggerQuery}

`
}



module.exports = TriggerProcedureInsert ; 


