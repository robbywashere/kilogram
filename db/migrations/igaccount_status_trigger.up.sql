DROP TRIGGER IF EXISTS igaccount_status ON "IGAccounts";

CREATE TRIGGER igaccount_status
  AFTER UPDATE OF "status" --- ON "IGAccounts"
  FOR EACH ROW
  -- WHEN (OLD.status IS DISTINCT FROM NEW.status) -- AND OLD.status IS 'UNVERIFIED')
  EXECUTE PROCEDURE notify_event('igaccount_status');


