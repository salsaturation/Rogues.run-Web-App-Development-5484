-- Create Sessions Table with Enhanced Schema
CREATE TABLE IF NOT EXISTS sessions_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  end_time TIME,
  location TEXT NOT NULL,
  max_attendees INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_by UUID REFERENCES users_rogues_7a9k2m(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Location Details
  start_location_name TEXT,
  start_location_lat NUMERIC,
  start_location_lng NUMERIC,
  start_location_address TEXT,
  
  -- Route Specifics
  route_type TEXT DEFAULT 'flexible',
  route_map JSONB,
  total_distance NUMERIC,
  
  -- Run Characteristics
  run_type TEXT DEFAULT 'easy',
  pace_min NUMERIC,
  pace_max NUMERIC,
  difficulty TEXT DEFAULT 'beginner',
  
  -- Additional Features
  waitlist_enabled BOOLEAN DEFAULT FALSE,
  special_instructions TEXT,
  required_gear TEXT[]
);

-- Create Session Attendees Junction Table
CREATE TABLE IF NOT EXISTS session_attendees_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions_rogues_7a9k2m(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Create Session Interested Users Junction Table
CREATE TABLE IF NOT EXISTS session_interested_users_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions_rogues_7a9k2m(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Create Session Comments Table
CREATE TABLE IF NOT EXISTS session_comments_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions_rogues_7a9k2m(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_rogues_7a9k2m(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_id UUID REFERENCES session_comments_rogues_7a9k2m(id) ON DELETE CASCADE
);

-- Create Waitlist Table
CREATE TABLE IF NOT EXISTS session_waitlist_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions_rogues_7a9k2m(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Create function to increment sessions attended count
CREATE OR REPLACE FUNCTION increment_sessions_attended(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users_rogues_7a9k2m
  SET sessions_attended = COALESCE(sessions_attended, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE sessions_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendees_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_interested_users_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_comments_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_waitlist_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable public read access" ON sessions_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable public read access" ON session_attendees_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable public read access" ON session_interested_users_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable public read access" ON session_comments_rogues_7a9k2m FOR SELECT USING (true);

-- Insert sample sessions
INSERT INTO sessions_rogues_7a9k2m (
  title, 
  description, 
  session_date, 
  session_time, 
  location, 
  max_attendees, 
  start_location_name,
  start_location_lat,
  start_location_lng,
  route_type,
  total_distance,
  run_type,
  pace_min,
  pace_max,
  difficulty,
  special_instructions,
  required_gear
) VALUES 
(
  'Morning Run',
  'Join us for a refreshing morning run through Central Park. Perfect for beginners and experienced runners alike.',
  CURRENT_DATE + 1,
  '07:00',
  'Central Park',
  20,
  'Central Park Main Entrance',
  40.7812,
  -73.9665,
  'flexible',
  5,
  'easy',
  6,
  7,
  'beginner',
  'Please arrive 10 minutes early for a group stretch.',
  ARRAY['Water bottle', 'Running shoes']
),
(
  'Hill Training Session',
  'Challenging hill repeats to build strength and endurance. Be prepared for an intense workout!',
  CURRENT_DATE + 3,
  '18:30',
  'Hill Park',
  15,
  'Hill Park South Entrance',
  40.7545,
  -73.9840,
  'structured',
  8,
  'interval',
  5,
  6.5,
  'intermediate',
  'We will do 8-10 hill repeats with recovery jogs in between.',
  ARRAY['Water bottle', 'Running shoes', 'Towel']
),
(
  'Weekend Long Run',
  'A longer, conversational-paced run to build endurance. Great for marathon training or just enjoying a longer distance.',
  CURRENT_DATE + 5,
  '08:00',
  'Riverside Trail',
  25,
  'Riverside Park North Entrance',
  40.8010,
  -73.9720,
  'predefined',
  12,
  'long-slow',
  6.5,
  7.5,
  'intermediate',
  'We will have water stations every 3km. Run at a conversational pace.',
  ARRAY['Water bottle', 'Energy gels', 'Running shoes', 'Hat']
);