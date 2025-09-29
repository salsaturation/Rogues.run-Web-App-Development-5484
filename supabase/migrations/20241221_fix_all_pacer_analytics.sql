-- Drop existing functions that have errors
DROP FUNCTION IF EXISTS get_community_pacer_stats(DATE);
DROP FUNCTION IF EXISTS get_user_pacer_stats(UUID, DATE);
DROP FUNCTION IF EXISTS get_pacer_coverage(DATE, DATE);
DROP FUNCTION IF EXISTS get_pacer_opportunities(UUID);
DROP FUNCTION IF EXISTS get_pacer_achievements(UUID);
DROP FUNCTION IF EXISTS get_pacer_recognition(INTEGER);
DROP FUNCTION IF EXISTS get_pacer_goals_progress(UUID);

-- Create corrected analytics functions with proper table names and return types
CREATE OR REPLACE FUNCTION get_community_pacer_stats(start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days')
RETURNS TABLE (
  total_pacers INTEGER,
  active_pacers INTEGER,
  total_sessions INTEGER,
  sessions_with_pacers INTEGER,
  avg_pacers_per_session NUMERIC,
  coverage_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(DISTINCT user_id)::INTEGER 
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE s.date >= start_date), 0) as total_pacers,
    
    COALESCE((SELECT COUNT(DISTINCT pgp.user_id)::INTEGER 
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE s.date >= start_date 
              AND pgp.status = 'confirmed'), 0) as active_pacers,
    
    COALESCE((SELECT COUNT(*)::INTEGER 
              FROM sessions_rogues_7a9k2m 
              WHERE date >= start_date), 0) as total_sessions,
    
    COALESCE((SELECT COUNT(DISTINCT s.id)::INTEGER 
              FROM sessions_rogues_7a9k2m s
              JOIN pace_groups_rogues_7a9k2m pg ON s.id = pg.session_id
              JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
              WHERE s.date >= start_date 
              AND pgp.status = 'confirmed'), 0) as sessions_with_pacers,
    
    COALESCE((SELECT ROUND(AVG(pacer_count), 2)
              FROM (
                SELECT COUNT(pgp.id) as pacer_count
                FROM sessions_rogues_7a9k2m s
                LEFT JOIN pace_groups_rogues_7a9k2m pg ON s.id = pg.session_id
                LEFT JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id AND pgp.status = 'confirmed'
                WHERE s.date >= start_date
                GROUP BY s.id
              ) session_stats), 0) as avg_pacers_per_session,
    
    CASE 
      WHEN (SELECT COUNT(*) FROM sessions_rogues_7a9k2m WHERE date >= start_date) = 0 THEN 0
      ELSE COALESCE((SELECT ROUND((COUNT(DISTINCT s.id)::NUMERIC / (SELECT COUNT(*) FROM sessions_rogues_7a9k2m WHERE date >= start_date)::NUMERIC) * 100)::INTEGER
                     FROM sessions_rogues_7a9k2m s
                     JOIN pace_groups_rogues_7a9k2m pg ON s.id = pg.session_id
                     JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
                     WHERE s.date >= start_date 
                     AND pgp.status = 'confirmed'), 0)
    END as coverage_percentage;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_pacer_stats(user_id UUID, start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days')
RETURNS TABLE (
  sessions_paced INTEGER,
  total_distance NUMERIC,
  favorite_pace TEXT,
  consistency_score INTEGER,
  last_paced_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(DISTINCT pg.session_id)::INTEGER
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE pgp.user_id = get_user_pacer_stats.user_id
              AND s.date >= start_date
              AND pgp.status = 'confirmed'), 0) as sessions_paced,
    
    COALESCE((SELECT SUM(s.distance)
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE pgp.user_id = get_user_pacer_stats.user_id
              AND s.date >= start_date
              AND pgp.status = 'confirmed'), 0) as total_distance,
    
    COALESCE((SELECT pg.target_pace
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE pgp.user_id = get_user_pacer_stats.user_id
              AND pgp.status = 'confirmed'
              GROUP BY pg.target_pace
              ORDER BY COUNT(*) DESC
              LIMIT 1), 'N/A') as favorite_pace,
    
    LEAST(100, COALESCE((SELECT COUNT(DISTINCT pg.session_id)::INTEGER * 10
                         FROM pace_group_pacers_rogues_7a9k2m pgp
                         JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
                         JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
                         WHERE pgp.user_id = get_user_pacer_stats.user_id
                         AND s.date >= start_date
                         AND pgp.status = 'confirmed'), 0)) as consistency_score,
    
    (SELECT MAX(s.date)
     FROM pace_group_pacers_rogues_7a9k2m pgp
     JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
     JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
     WHERE pgp.user_id = get_user_pacer_stats.user_id
     AND pgp.status = 'confirmed') as last_paced_date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pacer_coverage(start_date DATE DEFAULT CURRENT_DATE, end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days')
RETURNS TABLE (
  session_id UUID,
  session_name TEXT,
  session_date DATE,
  total_pace_groups INTEGER,
  covered_pace_groups INTEGER,
  coverage_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    COALESCE(s.title, 'Untitled Session') as session_name,
    s.date as session_date,
    COALESCE((SELECT COUNT(*)::INTEGER FROM pace_groups_rogues_7a9k2m WHERE session_id = s.id), 0) as total_pace_groups,
    COALESCE((SELECT COUNT(DISTINCT pg.id)::INTEGER 
              FROM pace_groups_rogues_7a9k2m pg
              JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
              WHERE pg.session_id = s.id AND pgp.status = 'confirmed'), 0) as covered_pace_groups,
    CASE 
      WHEN (SELECT COUNT(*) FROM pace_groups_rogues_7a9k2m WHERE session_id = s.id) = 0 THEN 0
      ELSE COALESCE((SELECT ROUND((COUNT(DISTINCT pg.id)::NUMERIC / (SELECT COUNT(*) FROM pace_groups_rogues_7a9k2m WHERE session_id = s.id)::NUMERIC) * 100)::INTEGER
                     FROM pace_groups_rogues_7a9k2m pg
                     JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
                     WHERE pg.session_id = s.id AND pgp.status = 'confirmed'), 0)
    END as coverage_percentage
  FROM sessions_rogues_7a9k2m s
  WHERE s.date BETWEEN start_date AND end_date
  ORDER BY s.date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pacer_opportunities(user_id UUID DEFAULT NULL)
RETURNS TABLE (
  session_id UUID,
  session_name TEXT,
  session_date DATE,
  pace_group_id UUID,
  pace_group_name TEXT,
  target_pace TEXT,
  needs_pacer BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    COALESCE(s.title, 'Untitled Session') as session_name,
    s.date as session_date,
    pg.id as pace_group_id,
    pg.name as pace_group_name,
    pg.target_pace as target_pace,
    CASE 
      WHEN (SELECT COUNT(*) FROM pace_group_pacers_rogues_7a9k2m WHERE pace_group_id = pg.id AND status = 'confirmed') = 0 
      THEN true 
      ELSE false 
    END as needs_pacer
  FROM sessions_rogues_7a9k2m s
  JOIN pace_groups_rogues_7a9k2m pg ON s.id = pg.session_id
  WHERE s.date >= CURRENT_DATE
  AND (user_id IS NULL OR pg.id NOT IN (
    SELECT pace_group_id FROM pace_group_pacers_rogues_7a9k2m 
    WHERE user_id = get_pacer_opportunities.user_id
  ))
  ORDER BY s.date, pg.target_pace;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pacer_achievements(user_id UUID)
RETURNS TABLE (
  achievement_type TEXT,
  achievement_name TEXT,
  description TEXT,
  earned_date DATE,
  badge_icon TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(DISTINCT pg.session_id) as sessions_paced,
      SUM(s.distance) as total_distance,
      COUNT(DISTINCT pg.target_pace) as different_paces
    FROM pace_group_pacers_rogues_7a9k2m pgp
    JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
    JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
    WHERE pgp.user_id = get_pacer_achievements.user_id
    AND pgp.status = 'confirmed'
  )
  SELECT 
    'milestone'::TEXT as achievement_type,
    'First Pace'::TEXT as achievement_name,
    'Completed your first pacing session'::TEXT as description,
    CURRENT_DATE as earned_date,
    'trophy'::TEXT as badge_icon
  FROM user_stats
  WHERE sessions_paced >= 1
  
  UNION ALL
  
  SELECT 
    'milestone'::TEXT as achievement_type,
    'Dedicated Pacer'::TEXT as achievement_name,
    'Paced 5 or more sessions'::TEXT as description,
    CURRENT_DATE as earned_date,
    'star'::TEXT as badge_icon
  FROM user_stats
  WHERE sessions_paced >= 5
  
  UNION ALL
  
  SELECT 
    'distance'::TEXT as achievement_type,
    'Distance Champion'::TEXT as achievement_name,
    'Paced over 50 total distance units'::TEXT as description,
    CURRENT_DATE as earned_date,
    'target'::TEXT as badge_icon
  FROM user_stats
  WHERE total_distance >= 50;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pacer_recognition(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  sessions_paced INTEGER,
  total_distance NUMERIC,
  recognition_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pgp.user_id,
    COALESCE(u.first_name || ' ' || u.last_name, u.email) as user_name,
    COUNT(DISTINCT pg.session_id)::INTEGER as sessions_paced,
    COALESCE(SUM(s.distance), 0) as total_distance,
    'top_pacer'::TEXT as recognition_type
  FROM pace_group_pacers_rogues_7a9k2m pgp
  JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
  JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
  JOIN users_rogues_7a9k2m u ON pgp.user_id = u.id
  WHERE pgp.status = 'confirmed'
  AND s.date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY pgp.user_id, u.first_name, u.last_name, u.email
  ORDER BY sessions_paced DESC, total_distance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pacer_goals_progress(user_id UUID)
RETURNS TABLE (
  goal_type TEXT,
  goal_name TEXT,
  current_progress INTEGER,
  target_value INTEGER,
  progress_percentage INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(DISTINCT pg.session_id) as sessions_paced,
      SUM(s.distance) as total_distance
    FROM pace_group_pacers_rogues_7a9k2m pgp
    JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
    JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
    WHERE pgp.user_id = get_pacer_goals_progress.user_id
    AND pgp.status = 'confirmed'
    AND s.date >= DATE_TRUNC('month', CURRENT_DATE)
  )
  SELECT 
    'monthly'::TEXT as goal_type,
    'Monthly Sessions'::TEXT as goal_name,
    COALESCE(sessions_paced::INTEGER, 0) as current_progress,
    4 as target_value,
    LEAST(100, COALESCE(ROUND((sessions_paced::NUMERIC / 4) * 100)::INTEGER, 0)) as progress_percentage,
    CASE 
      WHEN COALESCE(sessions_paced, 0) >= 4 THEN 'completed'::TEXT
      ELSE 'in_progress'::TEXT
    END as status
  FROM user_stats
  
  UNION ALL
  
  SELECT 
    'monthly'::TEXT as goal_type,
    'Monthly Distance'::TEXT as goal_name,
    COALESCE(total_distance::INTEGER, 0) as current_progress,
    50 as target_value,
    LEAST(100, COALESCE(ROUND((total_distance / 50) * 100)::INTEGER, 0)) as progress_percentage,
    CASE 
      WHEN COALESCE(total_distance, 0) >= 50 THEN 'completed'::TEXT
      ELSE 'in_progress'::TEXT
    END as status
  FROM user_stats;
END;
$$ LANGUAGE plpgsql;

-- Now create comprehensive test data
-- First, let's add some test users
INSERT INTO users_rogues_7a9k2m (id, email, first_name, last_name, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'pacer1@test.com', 'John', 'Pacer', NOW() - INTERVAL '60 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'pacer2@test.com', 'Jane', 'Runner', NOW() - INTERVAL '45 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'pacer3@test.com', 'Bob', 'Swift', NOW() - INTERVAL '30 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'pacer4@test.com', 'Alice', 'Fast', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- Create test sessions with proper titles
INSERT INTO sessions_rogues_7a9k2m (id, title, description, date, time, distance, status, created_by, created_at)
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', 'Morning Track Session', 'Speed work on the track', CURRENT_DATE - INTERVAL '7 days', '07:00:00', 8.0, 'completed', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '8 days'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Evening Long Run', 'Steady pace long run', CURRENT_DATE - INTERVAL '14 days', '18:00:00', 12.0, 'completed', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '15 days'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Tempo Tuesday', 'Tempo run session', CURRENT_DATE - INTERVAL '21 days', '07:30:00', 6.0, 'completed', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '22 days'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Weekend Group Run', 'Social group run', CURRENT_DATE + INTERVAL '3 days', '08:00:00', 10.0, 'active', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 days'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Hill Training', 'Hill repeat session', CURRENT_DATE + INTERVAL '10 days', '07:00:00', 5.0, 'active', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- Create pace groups for these sessions
INSERT INTO pace_groups_rogues_7a9k2m (id, session_id, name, target_pace, description, created_at)
VALUES 
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '7:00 min/mile', '7:00', 'Fast pace group', NOW() - INTERVAL '8 days'),
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '8:00 min/mile', '8:00', 'Medium pace group', NOW() - INTERVAL '8 days'),
  ('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', '7:30 min/mile', '7:30', 'Steady pace group', NOW() - INTERVAL '15 days'),
  ('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', '8:30 min/mile', '8:30', 'Comfortable pace group', NOW() - INTERVAL '15 days'),
  ('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', '6:45 min/mile', '6:45', 'Tempo pace group', NOW() - INTERVAL '22 days'),
  ('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440004', '8:00 min/mile', '8:00', 'Social pace group', NOW() - INTERVAL '1 days'),
  ('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440005', '7:15 min/mile', '7:15', 'Hill pace group', NOW() - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- Add pacers to these pace groups
INSERT INTO pace_group_pacers_rogues_7a9k2m (id, pace_group_id, user_id, role, status, volunteered_at, approved_at, created_at)
VALUES 
  ('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'primary', 'confirmed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'primary', 'confirmed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'primary', 'confirmed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'shadow', 'confirmed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'primary', 'confirmed', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  ('850e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', 'primary', 'pending', NOW() - INTERVAL '1 days', NULL, NOW() - INTERVAL '1 days'),
  ('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'primary', 'volunteered', NOW() - INTERVAL '1 days', NULL, NOW() - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- Add some session attendance for completed sessions
INSERT INTO session_attendance_rogues_7a9k2m (id, session_id, user_id, attended, self_reported, created_at)
VALUES 
  ('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', true, false, NOW() - INTERVAL '7 days'),
  ('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', true, false, NOW() - INTERVAL '7 days'),
  ('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', true, false, NOW() - INTERVAL '14 days'),
  ('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', true, false, NOW() - INTERVAL '14 days'),
  ('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', true, false, NOW() - INTERVAL '21 days')
ON CONFLICT (id) DO NOTHING;