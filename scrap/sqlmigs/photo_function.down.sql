BEGIN;
  DROP FUNCTION IF EXISTS photo_function();
  DROP TRIGGER IF EXISTS photo_function on bucketevents;
END;
