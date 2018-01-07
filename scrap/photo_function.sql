CREATE OR REPLACE FUNCTION photo_uploaded() RETURNS trigger AS
$$
    if (NEW.value.Records[0].eventName === "s3:ObjectCreated:Put") {
      UUID = NEW.key.split('/')[1].split('.')[0];
      if (UUID) plv8.execute( 'UPDATE "Photos" SET uploaded=true WHERE UUID=$1', [ UUID ] );
    }
$$
LANGUAGE "plv8";


CREATE OR REPLACE FUNCTION photo_removed() RETURNS trigger AS
$$
    if (NEW.value.Records[0].eventName === "s3:ObjectRemoved:Delete") {
      UUID = NEW.key.split('/')[1].split('.')[0];
      if (UUID) plv8.execute( 'UPDATE "Photos" SET deleted=true WHERE UUID=$1', [ UUID ] );
    }
$$
LANGUAGE "plv8";


DROP TRIGGER  IF EXISTS photo_uploaded ON BucketEvents;

CREATE TRIGGER photo_uploaded
    AFTER INSERT
    ON BucketEvents FOR EACH ROW
    EXECUTE PROCEDURE photo_uploaded();

DROP TRIGGER IF EXISTS photo_removed ON BucketEvents;

CREATE TRIGGER photo_removed
    AFTER INSERT
    ON BucketEvents FOR EACH ROW
    EXECUTE PROCEDURE photo_removed();
