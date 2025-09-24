-- Create Goal Categories Table
CREATE TABLE IF NOT EXISTS goal_categories_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT 'blue',
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Goal Templates Table
CREATE TABLE IF NOT EXISTS goal_templates_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES goal_categories_rogues_7a9k2m(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL, -- 'distance', 'sessions', 'time', 'count', etc.
  default_target_value NUMERIC,
  unit TEXT, -- 'km', 'miles', 'minutes', 'sessions', etc.
  difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  estimated_duration TEXT, -- '4 weeks', '3 months', etc.
  instructions TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add template_id to existing goals table
ALTER TABLE goals_rogues_7a9k2m ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES goal_templates_rogues_7a9k2m(id);
ALTER TABLE goals_rogues_7a9k2m ADD COLUMN IF NOT EXISTS goal_metadata JSONB DEFAULT '{}';
ALTER TABLE goals_rogues_7a9k2m ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE goals_rogues_7a9k2m ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE goal_categories_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_templates_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable public read access" ON goal_categories_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable public read access" ON goal_templates_rogues_7a9k2m FOR SELECT USING (true);

-- Create indexes
CREATE INDEX idx_goal_templates_category ON goal_templates_rogues_7a9k2m(category_id);
CREATE INDEX idx_goal_templates_popular ON goal_templates_rogues_7a9k2m(is_popular);
CREATE INDEX idx_goals_template ON goals_rogues_7a9k2m(template_id);

-- Insert Goal Categories
INSERT INTO goal_categories_rogues_7a9k2m (name, description, icon, color, display_order) VALUES
('Distance & Endurance', 'Goals focused on completing distances and building endurance', 'activity', 'blue', 1),
('Speed & Performance', 'Goals aimed at improving pace and racing performance', 'trending-up', 'red', 2),
('Consistency & Habits', 'Goals for building regular running habits and streaks', 'calendar', 'green', 3),
('Strength & Cross-Training', 'Goals incorporating strength training and cross-training', 'zap', 'purple', 4),
('Social & Community', 'Goals involving group activities and community challenges', 'users', 'orange', 5),
('Health & Wellness', 'Goals focused on overall health and wellness through running', 'heart', 'pink', 6);

-- Insert Distance & Endurance Goal Templates
INSERT INTO goal_templates_rogues_7a9k2m (
  category_id, name, description, target_type, default_target_value, unit, 
  difficulty, estimated_duration, instructions, is_popular
) VALUES
-- Individual Distance Goals
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Distance & Endurance'),
  'Run Your First 5K',
  'Complete your first 5-kilometer run without stopping',
  'distance',
  5,
  'km',
  'beginner',
  '8-12 weeks',
  'Start with a walk-run program, gradually increasing running intervals. Aim for 3-4 sessions per week.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Distance & Endurance'),
  'Run Your First 10K',
  'Complete a 10-kilometer run',
  'distance',
  10,
  'km',
  'intermediate',
  '12-16 weeks',
  'Build your base with regular 5K runs first. Gradually increase weekly mileage by 10%.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Distance & Endurance'),
  'Half Marathon Challenge',
  'Complete a 21.1km half marathon',
  'distance',
  21.1,
  'km',
  'intermediate',
  '12-20 weeks',
  'Requires solid 10K base. Include one long run per week, gradually building distance.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Distance & Endurance'),
  'Marathon Milestone',
  'Complete a full 42.2km marathon',
  'distance',
  42.2,
  'km',
  'advanced',
  '16-24 weeks',
  'Requires half marathon experience. Follow a structured training plan with proper rest and nutrition.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Distance & Endurance'),
  'Ultra Marathon Adventure',
  'Complete an ultramarathon (50K or more)',
  'distance',
  50,
  'km',
  'advanced',
  '24-32 weeks',
  'Requires marathon experience. Focus on time on feet rather than pace. Practice nutrition strategy.',
  false
),
-- Monthly Distance Goals
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Distance & Endurance'),
  'Monthly 50K Challenge',
  'Run 50 kilometers in one month',
  'distance',
  50,
  'km',
  'beginner',
  '1 month',
  'Spread evenly across the month. About 12-13km per week or 1.6km per day.',
  false
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Distance & Endurance'),
  'Monthly 100K Challenge',
  'Run 100 kilometers in one month',
  'distance',
  100,
  'km',
  'intermediate',
  '1 month',
  'About 25km per week. Mix easy runs with one longer run per week.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Distance & Endurance'),
  'Monthly 200K Challenge',
  'Run 200 kilometers in one month',
  'distance',
  200,
  'km',
  'advanced',
  '1 month',
  'About 50km per week. Requires consistent daily running and proper recovery.',
  false
);

-- Insert Speed & Performance Goal Templates
INSERT INTO goal_templates_rogues_7a9k2m (
  category_id, name, description, target_type, default_target_value, unit, 
  difficulty, estimated_duration, instructions, is_popular
) VALUES
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Speed & Performance'),
  'Sub-30 5K',
  'Run a 5K in under 30 minutes',
  'time',
  30,
  'minutes',
  'intermediate',
  '8-12 weeks',
  'Include tempo runs and intervals. Target pace: 6:00 min/km. Focus on consistent pacing.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Speed & Performance'),
  'Sub-25 5K',
  'Run a 5K in under 25 minutes',
  'time',
  25,
  'minutes',
  'advanced',
  '12-16 weeks',
  'Include speed work 2x per week. Target pace: 5:00 min/km. Requires strong aerobic base.',
  false
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Speed & Performance'),
  'Sub-60 10K',
  'Run a 10K in under 60 minutes',
  'time',
  60,
  'minutes',
  'intermediate',
  '12-16 weeks',
  'Target pace: 6:00 min/km. Include tempo runs and gradually increase distance.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Speed & Performance'),
  'Sub-2:00 Half Marathon',
  'Complete a half marathon in under 2 hours',
  'time',
  120,
  'minutes',
  'advanced',
  '16-20 weeks',
  'Target pace: 5:40 min/km. Requires consistent training and race strategy.',
  false
);

-- Insert Consistency & Habits Goal Templates
INSERT INTO goal_templates_rogues_7a9k2m (
  category_id, name, description, target_type, default_target_value, unit, 
  difficulty, estimated_duration, instructions, is_popular
) VALUES
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Consistency & Habits'),
  'Run Streak - 30 Days',
  'Run at least 1km every day for 30 consecutive days',
  'streak',
  30,
  'days',
  'intermediate',
  '30 days',
  'Minimum 1km per day. Listen to your body and adjust intensity. Some days can be very easy.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Consistency & Habits'),
  'Run Streak - 100 Days',
  'Run at least 1km every day for 100 consecutive days',
  'streak',
  100,
  'days',
  'advanced',
  '100 days',
  'Long-term commitment. Vary intensity and include recovery runs. Have a backup indoor plan.',
  false
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Consistency & Habits'),
  'Weekly Running Habit',
  'Run at least 3 times per week for 8 weeks',
  'frequency',
  24,
  'sessions',
  'beginner',
  '8 weeks',
  'Focus on consistency over intensity. Schedule runs like appointments. Start with comfortable pace.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Consistency & Habits'),
  'Morning Runner',
  'Complete 20 morning runs (before 9 AM)',
  'count',
  20,
  'sessions',
  'intermediate',
  '6-8 weeks',
  'Prepare gear the night before. Start with shorter distances. Build the morning routine gradually.',
  false
);

-- Insert Social & Community Goal Templates
INSERT INTO goal_templates_rogues_7a9k2m (
  category_id, name, description, target_type, default_target_value, unit, 
  difficulty, estimated_duration, instructions, is_popular
) VALUES
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Social & Community'),
  'Group Run Regular',
  'Attend 10 group running sessions',
  'sessions',
  10,
  'sessions',
  'beginner',
  '8-12 weeks',
  'Join group runs that match your pace. Focus on social aspect and building connections.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Social & Community'),
  'Mentor a New Runner',
  'Help 1 new runner complete their first 5K',
  'count',
  1,
  'person',
  'intermediate',
  '8-12 weeks',
  'Share your experience and provide encouragement. Run together and offer practical advice.',
  false
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Social & Community'),
  'Race Team Member',
  'Participate in 3 races as part of the club team',
  'count',
  3,
  'races',
  'intermediate',
  '12-16 weeks',
  'Register for club races. Support teammates and enjoy the competitive spirit.',
  false
);

-- Insert Health & Wellness Goal Templates
INSERT INTO goal_templates_rogues_7a9k2m (
  category_id, name, description, target_type, default_target_value, unit, 
  difficulty, estimated_duration, instructions, is_popular
) VALUES
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Health & Wellness'),
  'Active Recovery',
  'Complete 15 easy recovery runs',
  'count',
  15,
  'sessions',
  'beginner',
  '8-10 weeks',
  'Focus on easy pace, conversational effort. These runs aid recovery and build aerobic base.',
  true
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Health & Wellness'),
  'Mindful Running',
  'Complete 10 runs focused on mindfulness',
  'count',
  10,
  'sessions',
  'beginner',
  '6-8 weeks',
  'Leave devices behind. Focus on breathing, surroundings, and body awareness.',
  false
),
(
  (SELECT id FROM goal_categories_rogues_7a9k2m WHERE name = 'Health & Wellness'),
  'Weight Management',
  'Maintain consistent running for weight goals',
  'consistency',
  12,
  'weeks',
  'intermediate',
  '12 weeks',
  'Combine regular running with healthy nutrition. Track progress weekly.',
  false
);