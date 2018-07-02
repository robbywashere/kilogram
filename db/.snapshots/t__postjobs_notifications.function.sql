CREATE OR REPLACE FUNCTION public.t__postjobs_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE 
  body json;
  row_data json;
  meta json;
  BEGIN

    body = json_build_object('data',json_build_object('PostJob',json_build_object('PostId', NEW."PostId",'AccountId', NEW."AccountId",'IGAccountId', NEW."IGAccountId",'status', NEW."status",'id', NEW."id")), 'meta','{"type":"PostJob:status","resource":"PostJob"}'::json);

    INSERT INTO "Notifications" ("createdAt","updatedAt",body,"AccountId")

    VALUES (NOW(),NOW(),body,NEW."AccountId");

  RETURN NEW;

END;
$function$
