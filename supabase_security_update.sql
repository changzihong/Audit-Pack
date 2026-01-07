-- Refined SQL for Row-Level Security and Role Management

-- Ensure Profiles handle the new metadata correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, department)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    COALESCE(new.raw_user_meta_data->>'department', 'General')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RE-ENABLE THE TRIGGER (if you already ran the previous script, this replaces it)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- REFINE REQUEST POLICIES for strict visibility
DROP POLICY IF EXISTS "Employees can view own requests" ON requests;
DROP POLICY IF EXISTS "Managers can view department requests" ON requests;

-- 1. Employee Policy: Only see what they created
CREATE POLICY "Employees can view own requests" ON requests
  FOR SELECT USING (
    auth.uid() = employee_id
  );

-- 2. Manager/Admin Policy: Admins see all, Managers see department
CREATE POLICY "Managers/Admins visibility" ON requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role = 'admin' OR 
        (role = 'manager' AND department = requests.department)
      )
    )
  );

-- 3. Update Policy: Strict access for status changes
CREATE POLICY "Request modification policy" ON requests
  FOR UPDATE USING (
    auth.uid() = employee_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role = 'admin' OR 
        (role = 'manager' AND department = requests.department)
      )
    )
  );
