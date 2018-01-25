BEGIN;
create extension IF NOT EXISTS plv8;
CREATE OR REPLACE FUNCTION photo_function() RETURNS trigger AS
$$
    if (NEW) {
      var RX = NEW;
      } else {
      var RX = OLD;
      }
      var event = RX.value.Records[0].eventName;

      var UUID = RX.key.split('/')[1].split('.')[0];

    if (UUID && TG_OP === "INSERT") {
      plv8.execute( 'UPDATE "Photos" SET uploaded=true WHERE UUID=$1', [ UUID ] );
    }
    if (UUID && TG_OP === "DELETE") {
      plv8.execute( 'UPDATE "Photos" SET deleted=true WHERE UUID=$1', [ UUID ] );
    }
$$
LANGUAGE "plv8";


DROP TRIGGER IF EXISTS photo_function ON bucketevents;

CREATE TRIGGER photo_function
    BEFORE INSERT OR DELETE
    ON bucketevents FOR EACH ROW
    EXECUTE PROCEDURE photo_function();

END;
