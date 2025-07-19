-- Create Goals Table
CREATE TABLE IF NOT EXISTS goals_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  goal_type TEXT NOT NULL,
  target_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users_rogues_7a9k2m(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE goals_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable public read access" ON goals_rogues_7a9k2m FOR SELECT USING (true);

-- Insert sample goals
INSERT INTO goals_rogues_7a9k2m (
  title,
  description,
  target_value,
  current_value,
  goal_type,
  target_date,
  created_by
)
SELECT 
  'Reach 50 Members',
  'Grow our running community to 50 active members',
  50,
  (SELECT COUNT(*) FROM users_rogues_7a9k2m WHERE is_approved = TRUE),
  'members',
  CURRENT_DATE + 90,
  (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM goals_rogues_7a9k2m WHERE title = 'Reach 50 Members');

INSERT INTO goals_rogues_7a9k2m (
  title,
  description,
  target_value,
  current_value,
  goal_type,
  target_date,
  created_by
)
SELECT
  'Complete 100 Group Sessions',
  'Host and complete 100 running sessions as a group',
  100,
  (SELECT COUNT(*) FROM sessions_rogues_7a9k2m),
  'sessions',
  CURRENT_DATE + 180,
  (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM goals_rogues_7a9k2m WHERE title = 'Complete 100 Group Sessions');

INSERT INTO goals_rogues_7a9k2m (
  title,
  description,
  target_value,
  current_value,
  goal_type,
  target_date,
  created_by
)
SELECT
  'Run 1000km Together',
  'Collectively run 1000km as a community',
  1000,
  0,
  'distance',
  CURRENT_DATE + 365,
  (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM goals_rogues_7a9k2m WHERE title = 'Run 1000km Together');