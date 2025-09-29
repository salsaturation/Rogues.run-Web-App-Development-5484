-- Add comprehensive test pacer data for debugging analytics

-- First, add more test users if they don't exist
INSERT INTO users_rogues_7a9k2m (id, email, full_name, role, pace_preference_min, pace_preference_max)
VALUES 
  ('test-pacer-1', 'sarah.jones@email.com', 'Sarah Jones', 'member', '00:07:30', '00:08:30'),
  ('test-pacer-2', 'mike.runner@email.com', 'Mike Runner', 'member', '00:08:00', '00:09:00'),
  ('test-pacer-3', 'lisa.fast@email.com', 'Lisa Fast', 'member', '00:06:30', '00:07:30'),
  ('test-pacer-4', 'tom.shadow@email.com', 'Tom Shadow', 'member', '00:09:00', '00:10:00'),
  ('test-pacer-5', 'emma.steady@email.com', 'Emma Steady', 'member', '00:08:30', '00:09:30'),
  ('test-pacer-6', 'alex.beginner@email.com', 'Alex Beginner', 'member', '00:10:00', '00:11:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  pace_preference_min = EXCLUDED.pace_preference_min,
  pace_preference_max = EXCLUDED.pace_preference_max;

-- Update existing completed sessions to have proper pace groups and pacers
DO $$
DECLARE
  completed_session_id UUID;
  fast_pace_group_id UUID;
  moderate_pace_group_id UUID;
  beginner_pace_group_id UUID;
  current_month_start DATE;
  last_month_start DATE;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  last_month_start := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  
  -- Find a completed session from this month
  SELECT id INTO completed_session_id 
  FROM sessions_rogues_7a9k2m 
  WHERE status = 'completed' 
    AND date >= current_month_start
  LIMIT 1;
  
  IF completed_session_id IS NOT NULL THEN
    -- Create pace groups for this session
    INSERT INTO pace_groups_rogues_7a9k2m (id, session_id, name, target_pace, description, max_participants)
    VALUES 
      (gen_random_uuid(), completed_session_id, 'Fast', '00:07:00', 'Fast pace group', 15),
      (gen_random_uuid(), completed_session_id, 'Moderate', '00:08:30', 'Moderate pace group', 20),
      (gen_random_uuid(), completed_session_id, 'Beginner', '00:10:00', 'Beginner pace group', 25)
    ON CONFLICT DO NOTHING
    RETURNING id;
    
    -- Get the pace group IDs
    SELECT id INTO fast_pace_group_id FROM pace_groups_rogues_7a9k2m WHERE session_id = completed_session_id AND name = 'Fast';
    SELECT id INTO moderate_pace_group_id FROM pace_groups_rogues_7a9k2m WHERE session_id = completed_session_id AND name = 'Moderate';
    SELECT id INTO beginner_pace_group_id FROM pace_groups_rogues_7a9k2m WHERE session_id = completed_session_id AND name = 'Beginner';
    
    -- Add pacers to these pace groups
    INSERT INTO pacers_rogues_7a9k2m (id, pace_group_id, user_id, role, status, volunteer_at, approved_at, approved_by)
    VALUES 
      -- Fast pace group
      (gen_random_uuid(), fast_pace_group_id, 'test-pacer-3', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days', 'admin-user-test'),
      (gen_random_uuid(), fast_pace_group_id, 'test-pacer-1', 'shadow', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 'admin-user-test'),
      
      -- Moderate pace group  
      (gen_random_uuid(), moderate_pace_group_id, 'test-pacer-2', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '7 days', 'admin-user-test'),
      (gen_random_uuid(), moderate_pace_group_id, 'test-pacer-5', 'shadow', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 'admin-user-test'),
      
      -- Beginner pace group
      (gen_random_uuid(), beginner_pace_group_id, 'test-pacer-4', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '8 days', 'admin-user-test'),
      (gen_random_uuid(), beginner_pace_group_id, 'test-pacer-6', 'shadow', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 'admin-user-test')
    ON CONFLICT DO NOTHING;
    
    -- Make sure these pacers are also attendees
    INSERT INTO session_attendance_rogues_7a9k2m (id, session_id, user_id, status, attended)
    VALUES 
      (gen_random_uuid(), completed_session_id, 'test-pacer-1', 'registered', true),
      (gen_random_uuid(), completed_session_id, 'test-pacer-2', 'registered', true),
      (gen_random_uuid(), completed_session_id, 'test-pacer-3', 'registered', true),
      (gen_random_uuid(), completed_session_id, 'test-pacer-4', 'registered', true),
      (gen_random_uuid(), completed_session_id, 'test-pacer-5', 'registered', true),
      (gen_random_uuid(), completed_session_id, 'test-pacer-6', 'registered', true)
    ON CONFLICT (session_id, user_id) DO UPDATE SET
      attended = true,
      status = 'registered';
  END IF;
END $$;

-- Create additional completed sessions for more robust testing
DO $$
DECLARE
  session1_id UUID := gen_random_uuid();
  session2_id UUID := gen_random_uuid();
  session3_id UUID := gen_random_uuid();
  pg1_id UUID;
  pg2_id UUID;
  pg3_id UUID;
BEGIN
  -- Create 3 more completed sessions from this month
  INSERT INTO sessions_rogues_7a9k2m (id, name, description, date, start_time, distance, estimated_duration, location, status, completed_at, created_by)
  VALUES 
    (session1_id, 'Weekly Tempo Run', 'Mid-week tempo session', CURRENT_DATE - INTERVAL '10 days', '18:30:00', 5.0, '00:45:00', 'Park Starting Point', 'completed', CURRENT_DATE - INTERVAL '10 days' + INTERVAL '45 minutes', 'admin-user-test'),
    (session2_id, 'Saturday Long Run', 'Weekend long distance', CURRENT_DATE - INTERVAL '5 days', '08:00:00', 8.0, '01:15:00', 'River Trail', 'completed', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '75 minutes', 'admin-user-test'),
    (session3_id, 'Track Intervals', 'Speed work session', CURRENT_DATE - INTERVAL '3 days', '19:00:00', 4.0, '00:50:00', 'Athletic Track', 'completed', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '50 minutes', 'admin-user-test');
  
  -- Add pace groups and pacers for session 1
  INSERT INTO pace_groups_rogues_7a9k2m (id, session_id, name, target_pace, description, max_participants)
  VALUES 
    (gen_random_uuid(), session1_id, 'Fast', '00:07:15', 'Fast tempo pace', 12),
    (gen_random_uuid(), session1_id, 'Moderate', '00:08:45', 'Moderate tempo pace', 18)
  RETURNING id INTO pg1_id;
  
  SELECT id INTO pg1_id FROM pace_groups_rogues_7a9k2m WHERE session_id = session1_id AND name = 'Fast';
  SELECT id INTO pg2_id FROM pace_groups_rogues_7a9k2m WHERE session_id = session1_id AND name = 'Moderate';
  
  INSERT INTO pacers_rogues_7a9k2m (id, pace_group_id, user_id, role, status, volunteer_at, approved_at, approved_by)
  VALUES 
    (gen_random_uuid(), pg1_id, 'test-pacer-3', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '11 days', 'admin-user-test'),
    (gen_random_uuid(), pg2_id, 'test-pacer-2', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '11 days', CURRENT_TIMESTAMP - INTERVAL '10 days', 'admin-user-test'),
    (gen_random_uuid(), pg2_id, 'test-pacer-4', 'shadow', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '9 days', 'admin-user-test');
  
  -- Add pace groups and pacers for session 2
  INSERT INTO pace_groups_rogues_7a9k2m (id, session_id, name, target_pace, description, max_participants)
  VALUES 
    (gen_random_uuid(), session2_id, 'Fast', '00:07:30', 'Fast long run pace', 10),
    (gen_random_uuid(), session2_id, 'Moderate', '00:09:00', 'Moderate long run pace', 20),
    (gen_random_uuid(), session2_id, 'Beginner', '00:10:30', 'Beginner long run pace', 25);
  
  SELECT id INTO pg1_id FROM pace_groups_rogues_7a9k2m WHERE session_id = session2_id AND name = 'Fast';
  SELECT id INTO pg2_id FROM pace_groups_rogues_7a9k2m WHERE session_id = session2_id AND name = 'Moderate';
  SELECT id INTO pg3_id FROM pace_groups_rogues_7a9k2m WHERE session_id = session2_id AND name = 'Beginner';
  
  INSERT INTO pacers_rogues_7a9k2m (id, pace_group_id, user_id, role, status, volunteer_at, approved_at, approved_by)
  VALUES 
    (gen_random_uuid(), pg1_id, 'test-pacer-1', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days', 'admin-user-test'),
    (gen_random_uuid(), pg1_id, 'test-pacer-3', 'shadow', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 'admin-user-test'),
    (gen_random_uuid(), pg2_id, 'test-pacer-5', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '7 days', 'admin-user-test'),
    (gen_random_uuid(), pg3_id, 'test-pacer-6', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '8 days', 'admin-user-test'),
    (gen_random_uuid(), pg3_id, 'test-pacer-4', 'shadow', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days', 'admin-user-test');
  
  -- Add pace groups and pacers for session 3
  INSERT INTO pace_groups_rogues_7a9k2m (id, session_id, name, target_pace, description, max_participants)
  VALUES 
    (gen_random_uuid(), session3_id, 'Fast', '00:06:45', 'Fast interval pace', 8),
    (gen_random_uuid(), session3_id, 'Moderate', '00:08:15', 'Moderate interval pace', 15);
  
  SELECT id INTO pg1_id FROM pace_groups_rogues_7a9k2m WHERE session_id = session3_id AND name = 'Fast';
  SELECT id INTO pg2_id FROM pace_groups_rogues_7a9k2m WHERE session_id = session3_id AND name = 'Moderate';
  
  INSERT INTO pacers_rogues_7a9k2m (id, pace_group_id, user_id, role, status, volunteer_at, approved_at, approved_by)
  VALUES 
    (gen_random_uuid(), pg1_id, 'test-pacer-2', 'primary', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 'admin-user-test'),
    (gen_random_uuid(), pg2_id, 'test-pacer-1', 'shadow', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 'admin-user-test'),
    (gen_random_uuid(), pg2_id, 'test-pacer-5', 'shadow', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 'admin-user-test');
  
  -- Add attendance records for all pacers
  INSERT INTO session_attendance_rogues_7a9k2m (id, session_id, user_id, status, attended)
  SELECT 
    gen_random_uuid(),
    pg.session_id,
    p.user_id,
    'registered',
    true
  FROM pacers_rogues_7a9k2m p
  JOIN pace_groups_rogues_7a9k2m pg ON p.pace_group_id = pg.id
  WHERE pg.session_id IN (session1_id, session2_id, session3_id)
  ON CONFLICT (session_id, user_id) DO UPDATE SET
    attended = true,
    status = 'registered';
    
  -- Add some regular attendees to make the sessions more realistic
  INSERT INTO session_attendance_rogues_7a9k2m (id, session_id, user_id, status, attended)
  VALUES 
    -- Session 1 attendees
    (gen_random_uuid(), session1_id, 'member-user-test', 'registered', true),
    (gen_random_uuid(), session1_id, 'test-user-2', 'registered', true),
    (gen_random_uuid(), session1_id, 'test-user-3', 'registered', true),
    
    -- Session 2 attendees  
    (gen_random_uuid(), session2_id, 'member-user-test', 'registered', true),
    (gen_random_uuid(), session2_id, 'test-user-2', 'registered', true),
    (gen_random_uuid(), session2_id, 'test-user-3', 'registered', true),
    (gen_random_uuid(), session2_id, 'test-user-4', 'registered', true),
    
    -- Session 3 attendees
    (gen_random_uuid(), session3_id, 'member-user-test', 'registered', true),
    (gen_random_uuid(), session3_id, 'test-user-2', 'registered', true),
    (gen_random_uuid(), session3_id, 'test-user-4', 'registered', true)
  ON CONFLICT (session_id, user_id) DO UPDATE SET
    attended = true,
    status = 'registered';
    
END $$;

-- Update user stats to reflect their pacing activity
UPDATE users_rogues_7a9k2m 
SET 
  total_sessions = COALESCE(total_sessions, 0) + 4,
  sessions_this_month = COALESCE(sessions_this_month, 0) + 4,
  total_distance = COALESCE(total_distance, 0) + 21.0
WHERE id IN ('test-pacer-1', 'test-pacer-2', 'test-pacer-3', 'test-pacer-4', 'test-pacer-5', 'test-pacer-6');

-- Add some upcoming sessions with pace groups that need pacers
DO $$
DECLARE
  upcoming_session1_id UUID := gen_random_uuid();
  upcoming_session2_id UUID := gen_random_uuid();
  pg_id UUID;
BEGIN
  -- Create upcoming sessions
  INSERT INTO sessions_rogues_7a9k2m (id, name, description, date, start_time, distance, estimated_duration, location, status, created_by)
  VALUES 
    (upcoming_session1_id, 'Thursday Easy Run', 'Relaxed evening run', CURRENT_DATE + INTERVAL '2 days', '18:30:00', 4.0, '00:35:00', 'Park Loop', 'scheduled', 'admin-user-test'),
    (upcoming_session2_id, 'Sunday Long Run', 'Weekend endurance', CURRENT_DATE + INTERVAL '5 days', '08:00:00', 10.0, '01:30:00', 'Coastal Path', 'scheduled', 'admin-user-test');
  
  -- Add pace groups that need pacers
  INSERT INTO pace_groups_rogues_7a9k2m (id, session_id, name, target_pace, description, max_participants)
  VALUES 
    (gen_random_uuid(), upcoming_session1_id, 'Fast', '00:07:00', 'Fast easy pace', 12),
    (gen_random_uuid(), upcoming_session1_id, 'Moderate', '00:08:30', 'Moderate easy pace', 18),
    (gen_random_uuid(), upcoming_session1_id, 'Beginner', '00:10:00', 'Beginner easy pace', 25),
    
    (gen_random_uuid(), upcoming_session2_id, 'Fast', '00:07:45', 'Fast long run pace', 10),
    (gen_random_uuid(), upcoming_session2_id, 'Moderate', '00:09:15', 'Moderate long run pace', 20),
    (gen_random_uuid(), upcoming_session2_id, 'Beginner', '00:10:45', 'Beginner long run pace', 30);
  
  -- Add a few volunteer pacers for upcoming sessions
  SELECT id INTO pg_id FROM pace_groups_rogues_7a9k2m WHERE session_id = upcoming_session1_id AND name = 'Moderate';
  
  INSERT INTO pacers_rogues_7a9k2m (id, pace_group_id, user_id, role, status, volunteer_at)
  VALUES 
    (gen_random_uuid(), pg_id, 'test-pacer-2', 'primary', 'pending', CURRENT_TIMESTAMP - INTERVAL '1 day');
    
  -- Add attendance for the volunteer
  INSERT INTO session_attendance_rogues_7a9k2m (id, session_id, user_id, status, attended)
  VALUES 
    (gen_random_uuid(), upcoming_session1_id, 'test-pacer-2', 'registered', false)
  ON CONFLICT (session_id, user_id) DO UPDATE SET
    status = 'registered';
    
END $$;

-- Test the analytics functions to make sure they work
SELECT 'Testing community stats...' as test_status;
SELECT * FROM get_community_pacer_stats();

SELECT 'Testing user stats...' as test_status;  
SELECT * FROM get_user_pacer_stats('test-pacer-1');

SELECT 'Testing coverage...' as test_status;
SELECT * FROM get_pacer_coverage();

SELECT 'Testing opportunities...' as test_status;
SELECT * FROM get_pacer_opportunities();