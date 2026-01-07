-- Final refinement for Profile-linked Requests and Comments

-- Add profiles to search path for easier joins
-- (Mostly handled in application code via Supabase .select('*, profiles(...)'))

-- Ensure status changes are logged as comments automatically
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.comments (request_id, content, user_id)
    VALUES (NEW.id, 'Status changed from ' || OLD.status || ' to ' || NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_status_change ON requests;
CREATE TRIGGER on_request_status_change
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION public.log_status_change();
