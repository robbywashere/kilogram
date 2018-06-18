
const demand = require('../../lib/demand');

module.exports = ({ name = demand('name'), SQLFN }) => `CREATE OR REPLACE FUNCTION ${name}() RETURNS TRIGGER AS $$
    DECLARE 
        data json;
        notification json;
        event_name TEXT;
    BEGIN
        event_name = TG_ARGV[0];
        IF (TG_OP = 'DELETE') THEN
            data = row_to_json(OLD);
        ELSE
            data = row_to_json(NEW);
        END IF;
        
        -- Contruct the notification as a JSON string.

        notification = json_build_object(
                          'event_name', event_name,
                          'table', TG_TABLE_NAME,
                          'action', TG_OP,
                          'data', data);

        INSERT INTO "Notifications" (AccountId, body)

    END;
$$ LANGUAGE plpgsql;`;

