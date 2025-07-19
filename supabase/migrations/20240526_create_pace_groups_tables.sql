-- Create Pace Groups Table
CREATE TABLE IF NOT EXISTS pace_groups_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions_rogues_7a9k2m(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_pace NUMERIC NOT NULL,
  max_pace NUMERIC NOT NULL,
  description TEXT,
  required_pacers INTEGER NOT NULL DEFAULT 1,
  shadow_slots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Pace Group Pacers Junction Table
CREATE TABLE IF NOT EXISTS pace_group_pacers_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pace_group_id UUID REFERENCES pace_groups_rogues_7a9k2m(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'primary',
  status TEXT NOT NULL DEFAULT 'pending',
  volunteer_request_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pace_group_id, user_id)
);

-- Create Pacer Volunteer Requests Table
CREATE TABLE IF NOT EXISTS pacer_volunteer_requests_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions_rogues_7a9k2m(id) ON DELETE CASCADE,
  pace_group_ids UUID[] NOT NULL,
  preferred_roles TEXT[] NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Pacer Settings Table
CREATE TABLE IF NOT EXISTS pacer_settings_rogues_7a9k2m (
  id INTEGER PRIMARY KEY DEFAULT 1,
  pacer_role_title TEXT NOT NULL DEFAULT 'Pacer',
  shadow_role_title TEXT NOT NULL DEFAULT 'Shadow Pacer',
  allow_multi_group_volunteering BOOLEAN NOT NULL DEFAULT TRUE,
  auto_assign_pacers BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Create Pacer Performance Tracking Table
CREATE TABLE IF NOT EXISTS pacer_performance_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions_rogues_7a9k2m(id) ON DELETE CASCADE,
  pace_group_id UUID REFERENCES pace_groups_rogues_7a9k2m(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  actual_pace NUMERIC,
  consistency_rating INTEGER,
  feedback TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add column to Sessions table to control pacer approval requirements
ALTER TABLE sessions_rogues_7a9k2m 
ADD COLUMN IF NOT EXISTS require_pacer_approval BOOLEAN DEFAULT TRUE;

-- Add column to track pacer experience
ALTER TABLE users_rogues_7a9k2m 
ADD COLUMN IF NOT EXISTS pacer_experience JSONB DEFAULT '{"sessions_paced": 0, "ratings": [], "pace_ranges": [], "badges": []}';

-- Enable RLS
ALTER TABLE pace_groups_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE pace_group_pacers_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacer_volunteer_requests_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacer_settings_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacer_performance_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable public read access" ON pace_groups_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable public read access" ON pace_group_pacers_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable public read access" ON pacer_volunteer_requests_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable public read access" ON pacer_settings_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable public read access" ON pacer_performance_rogues_7a9k2m FOR SELECT USING (true);

-- Insert default pacer settings
INSERT INTO pacer_settings_rogues_7a9k2m 
(pacer_role_title, shadow_role_title, allow_multi_group_volunteering, auto_assign_pacers, require_approval)
VALUES 
('Pacer', 'Shadow Pacer', true, true, true)
ON CONFLICT (id) DO NOTHING;