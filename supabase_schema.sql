-- Create Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
  department TEXT DEFAULT 'General',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Requests table
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('expense', 'travel', 'purchase', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  sst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'in_review', 'approved', 'rejected', 'changes_requested')),
  ai_summary TEXT,
  ai_completeness_score INTEGER DEFAULT 0,
  department TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Requests Policies
CREATE POLICY "Employees can view own requests" ON requests
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Managers can view department requests" ON requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'manager' OR role = 'admin')
      AND (department = requests.department OR role = 'admin')
    )
  );

CREATE POLICY "Employees can insert own requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Allowed users can update requests" ON requests
  FOR UPDATE USING (
    auth.uid() = employee_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'manager' OR role = 'admin'))
  );

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, department)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    COALESCE(new.raw_user_meta_data->>'department', 'General')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
