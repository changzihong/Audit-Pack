-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger Function for Request Status Changes
CREATE OR REPLACE FUNCTION public.notify_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- 1. If status is changes_requested or approved/rejected, notify the employee
    IF NEW.status IN ('approved', 'rejected', 'changes_requested') THEN
        INSERT INTO public.notifications (user_id, title, message, type, request_id)
        VALUES (
            NEW.employee_id, 
            'Audit Status Updated', 
            'Your audit request "' || NEW.title || '" is now ' || NEW.status || '.',
            CASE WHEN NEW.status = 'approved' THEN 'success' WHEN NEW.status = 'rejected' THEN 'error' ELSE 'warning' END,
            NEW.id
        );
    END IF;

    -- 2. If status is pending (new or resubmitted), notify managers of that department and admins
    IF NEW.status = 'pending' THEN
        -- Notify Admins
        INSERT INTO public.notifications (user_id, title, message, type, request_id)
        SELECT id, 'New Audit Request', 'A new request "' || NEW.title || '" requires review.', 'info', NEW.id
        FROM public.profiles WHERE role = 'admin' AND id != NEW.employee_id;

        -- Notify Managers in same department
        INSERT INTO public.notifications (user_id, title, message, type, request_id)
        SELECT id, 'Department Audit Pending', 'A request from your department "' || NEW.title || '" is pending.', 'info', NEW.id
        FROM public.profiles WHERE role = 'manager' AND department = NEW.department AND id != NEW.employee_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for requests table
DROP TRIGGER IF EXISTS tr_notify_request_status ON requests;
CREATE TRIGGER tr_notify_request_status
  AFTER UPDATE OF status ON requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_request_status_change();
