-- Create Strava Integration Tables

-- Strava Connections Table
CREATE TABLE IF NOT EXISTS strava_connections_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  strava_athlete_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  athlete_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(strava_athlete_id)
);

-- Enhanced Goals Table with Strava Integration
CREATE TABLE IF NOT EXISTS enhanced_goals_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL,
  -- Basic goal types
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  -- Strava-specific fields
  strava_segment_id TEXT,
  strava_route_id TEXT,
  strava_club_id TEXT,
  metric_type TEXT, -- distance, elevation, kudos, etc.
  activity_type TEXT[] DEFAULT ARRAY['run'], -- run, ride, etc.
  date_range TSTZRANGE,
  -- Goal configuration
  scope TEXT NOT NULL, -- 'club', 'pace_group', 'individual'
  pace_group_id UUID REFERENCES pace_groups_rogues_7a9k2m(id),
  created_by UUID REFERENCES users_rogues_7a9k2m(id),
  is_active BOOLEAN DEFAULT TRUE,
  auto_sync BOOLEAN DEFAULT TRUE,
  -- Achievement criteria
  achievement_rules JSONB,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal Progress Tracking
CREATE TABLE IF NOT EXISTS goal_progress_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES enhanced_goals_rogues_7a9k2m(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_rogues_7a9k2m(id),
  strava_activity_id TEXT,
  contribution_value NUMERIC,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal Achievements
CREATE TABLE IF NOT EXISTS goal_achievements_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES enhanced_goals_rogues_7a9k2m(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_rogues_7a9k2m(id),
  achievement_type TEXT NOT NULL,
  achievement_data JSONB,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strava Activity Cache
CREATE TABLE IF NOT EXISTS strava_activities_cache_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strava_activity_id TEXT NOT NULL,
  user_id UUID REFERENCES users_rogues_7a9k2m(id),
  activity_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(strava_activity_id)
);

-- Enable RLS
ALTER TABLE strava_connections_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_goals_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_achievements_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_activities_cache_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_strava_connections_user ON strava_connections_rogues_7a9k2m(user_id);
CREATE INDEX idx_enhanced_goals_type ON enhanced_goals_rogues_7a9k2m(goal_type);
CREATE INDEX idx_enhanced_goals_scope ON enhanced_goals_rogues_7a9k2m(scope);
CREATE INDEX idx_goal_progress_goal ON goal_progress_rogues_7a9k2m(goal_id);
CREATE INDEX idx_goal_progress_user ON goal_progress_rogues_7a9k2m(user_id);
CREATE INDEX idx_strava_activities_user ON strava_activities_cache_rogues_7a9k2m(user_id);

-- Create policies
CREATE POLICY "Enable read access for all users" ON enhanced_goals_rogues_7a9k2m
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON enhanced_goals_rogues_7a9k2m
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for goal creators and admins" ON enhanced_goals_rogues_7a9k2m
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM users_rogues_7a9k2m 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert sample goals
INSERT INTO enhanced_goals_rogues_7a9k2m (
  title,
  description,
  goal_type,
  target_value,
  metric_type,
  scope,
  achievement_rules
) VALUES (
  'Spring 5000km Challenge',
  'Club-wide distance challenge for Spring 2024',
  'distance',
  5000,
  'distance',
  'club',
  '{"milestones": [1000, 2500, 5000], "badges": ["bronze", "silver", "gold"]}'
),
(
  'Hill Climbers Union',
  'Cumulative elevation challenge',
  'elevation',
  8848,
  'elevation_gain',
  'club',
  '{"milestones": [2000, 5000, 8848], "badges": ["base_camp", "climber", "everest"]}'
),
(
  'Segment Domination',
  'Own the local favorite segments',
  'segment',
  100,
  'attempts',
  'pace_group',
  '{"segment_id": "12345678", "requirements": {"attempts": 10, "improvements": 3}}'
);