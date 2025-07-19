-- Create Invitations Table
CREATE TABLE IF NOT EXISTS invitations_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  invited_by UUID REFERENCES users_rogues_7a9k2m(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE invitations_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable public read access" ON invitations_rogues_7a9k2m FOR SELECT USING (true);