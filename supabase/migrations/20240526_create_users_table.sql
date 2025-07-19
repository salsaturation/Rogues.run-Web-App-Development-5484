-- Create Users Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS users_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  picture TEXT,
  provider TEXT DEFAULT 'email',
  is_admin BOOLEAN DEFAULT FALSE,
  can_publish BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  location TEXT,
  bio TEXT,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sessions_attended INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable public read access" ON users_rogues_7a9k2m FOR SELECT USING (true);

-- Insert demo users (if table is empty)
INSERT INTO users_rogues_7a9k2m (
  name, 
  email, 
  is_admin, 
  can_publish, 
  is_approved, 
  location, 
  bio
) 
SELECT 
  'Admin User', 
  'admin@rogues.run', 
  TRUE, 
  TRUE, 
  TRUE, 
  'New York, NY', 
  'Administrator of Rogues.run'
WHERE NOT EXISTS (SELECT 1 FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run');

INSERT INTO users_rogues_7a9k2m (
  name, 
  email, 
  is_admin, 
  can_publish, 
  is_approved, 
  location, 
  bio
) 
SELECT 
  'Publisher User', 
  'publisher@rogues.run', 
  FALSE, 
  TRUE, 
  TRUE, 
  'New York, NY', 
  'Content publisher for Rogues.run'
WHERE NOT EXISTS (SELECT 1 FROM users_rogues_7a9k2m WHERE email = 'publisher@rogues.run');

INSERT INTO users_rogues_7a9k2m (
  name, 
  email, 
  is_admin, 
  can_publish, 
  is_approved, 
  location, 
  bio
) 
SELECT 
  'Regular Member', 
  'member@rogues.run', 
  FALSE, 
  FALSE, 
  TRUE, 
  'New York, NY', 
  'Regular member of the running community'
WHERE NOT EXISTS (SELECT 1 FROM users_rogues_7a9k2m WHERE email = 'member@rogues.run');