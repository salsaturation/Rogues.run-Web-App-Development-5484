-- Create a user mapping table to handle different ID formats
CREATE TABLE IF NOT EXISTS user_id_mapping_rogues_7a9k2m (
  external_id TEXT PRIMARY KEY,
  internal_uuid UUID REFERENCES users_rogues_7a9k2m(id),
  provider TEXT DEFAULT 'facebook',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_id_mapping_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable public read access" ON user_id_mapping_rogues_7a9k2m FOR SELECT USING (true);

-- Insert mapping for Facebook user
INSERT INTO user_id_mapping_rogues_7a9k2m (external_id, internal_uuid, provider)
SELECT 
  'facebook_user_1752932890041',
  u.id,
  'facebook'
FROM users_rogues_7a9k2m u
WHERE u.email = 'facebook_user_1752932890041@facebook.com'
ON CONFLICT (external_id) DO NOTHING;

-- Helper function to resolve user ID (text to UUID)
CREATE OR REPLACE FUNCTION resolve_user_id(input_user_id TEXT)
RETURNS UUID AS $$
DECLARE
  resolved_uuid UUID;
BEGIN
  -- First try to cast as UUID directly
  BEGIN
    resolved_uuid := input_user_id::UUID;
    RETURN resolved_uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    -- If that fails, look up in mapping table
    SELECT internal_uuid INTO resolved_uuid
    FROM user_id_mapping_rogues_7a9k2m
    WHERE external_id = input_user_id;
    
    IF resolved_uuid IS NULL THEN
      -- If still not found, return NULL
      RETURN NULL;
    END IF;
    
    RETURN resolved_uuid;
  END;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate all analytics functions with proper column names and user ID handling

-- 1. Community pacer stats (working fine)
DROP FUNCTION IF EXISTS get_community_pacer_stats(DATE);
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
              WHERE s.created_at::date >= start_date), 0) as total_pacers,
    
    COALESCE((SELECT COUNT(DISTINCT pgp.user_id)::INTEGER 
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE s.created_at::date >= start_date 
              AND pgp.status = 'confirmed'), 0) as active_pacers,
    
    COALESCE((SELECT COUNT(*)::INTEGER 
              FROM sessions_rogues_7a9k2m 
              WHERE created_at::date >= start_date), 0) as total_sessions,
    
    COALESCE((SELECT COUNT(DISTINCT s.id)::INTEGER 
              FROM sessions_rogues_7a9k2m s
              JOIN pace_groups_rogues_7a9k2m pg ON s.id = pg.session_id
              JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
              WHERE s.created_at::date >= start_date 
              AND pgp.status = 'confirmed'), 0) as sessions_with_pacers,
    
    COALESCE((SELECT ROUND(AVG(pacer_count), 2)
              FROM (
                SELECT COUNT(pgp.id) as pacer_count
                FROM sessions_rogues_7a9k2m s
                LEFT JOIN pace_groups_rogues_7a9k2m pg ON s.id = pg.session_id
                LEFT JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id AND pgp.status = 'confirmed'
                WHERE s.created_at::date >= start_date
                GROUP BY s.id
              ) session_stats), 0) as avg_pacers_per_session,
    
    CASE 
      WHEN (SELECT COUNT(*) FROM sessions_rogues_7a9k2m WHERE created_at::date >= start_date) = 0 THEN 0
      ELSE COALESCE((SELECT ROUND((COUNT(DISTINCT s.id)::NUMERIC / (SELECT COUNT(*) FROM sessions_rogues_7a9k2m WHERE created_at::date >= start_date)::NUMERIC) * 100)::INTEGER
                     FROM sessions_rogues_7a9k2m s
                     JOIN pace_groups_rogues_7a9k2m pg ON s.id = pg.session_id
                     JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
                     WHERE s.created_at::date >= start_date 
                     AND pgp.status = 'confirmed'), 0)
    END as coverage_percentage;
END;
$$ LANGUAGE plpgsql;

-- 2. User pacer stats with text user ID support
DROP FUNCTION IF EXISTS get_user_pacer_stats(TEXT, DATE);
DROP FUNCTION IF EXISTS get_user_pacer_stats(UUID, DATE);
CREATE OR REPLACE FUNCTION get_user_pacer_stats(user_id TEXT, start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days')
RETURNS TABLE (
  sessions_paced INTEGER,
  total_distance NUMERIC,
  favorite_pace TEXT,
  consistency_score INTEGER,
  last_paced_date DATE
) AS $$
DECLARE
  resolved_user_id UUID;
BEGIN
  -- Resolve the user ID
  resolved_user_id := resolve_user_id(user_id);
  
  IF resolved_user_id IS NULL THEN
    -- Return empty results if user not found
    RETURN QUERY
    SELECT 0, 0::NUMERIC, 'N/A'::TEXT, 0, NULL::DATE;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(DISTINCT pg.session_id)::INTEGER
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE pgp.user_id = resolved_user_id
              AND s.created_at::date >= start_date
              AND pgp.status = 'confirmed'), 0) as sessions_paced,
    
    COALESCE((SELECT SUM(s.distance)
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE pgp.user_id = resolved_user_id
              AND s.created_at::date >= start_date
              AND pgp.status = 'confirmed'), 0) as total_distance,
    
    COALESCE((SELECT pg.target_pace
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE pgp.user_id = resolved_user_id
              AND pgp.status = 'confirmed'
              GROUP BY pg.target_pace
              ORDER BY COUNT(*) DESC
              LIMIT 1), 'N/A') as favorite_pace,
    
    LEAST(100, COALESCE((SELECT COUNT(DISTINCT pg.session_id)::INTEGER * 10
                         FROM pace_group_pacers_rogues_7a9k2m pgp
                         JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
                         JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
                         WHERE pgp.user_id = resolved_user_id
                         AND s.created_at::date >= start_date
                         AND pgp.status = 'confirmed'), 0)) as consistency_score,
    
    (SELECT MAX(s.created_at::date)
     FROM pace_group_pacers_rogues_7a9k2m pgp
     JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
     JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
     WHERE pgp.user_id = resolved_user_id
     AND pgp.status = 'confirmed') as last_paced_date;
END;
$$ LANGUAGE plpgsql;

-- 3. Pacer coverage (fix column name from s.name to s.title)
DROP FUNCTION IF EXISTS get_pacer_coverage(DATE, DATE);
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
    s.created_at::date as session_date,
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
  WHERE s.created_at::date BETWEEN start_date AND end_date
  ORDER BY s.created_at;
END;
$$ LANGUAGE plpgsql;

-- 4. Pacer opportunities with text user ID support
DROP FUNCTION IF EXISTS get_pacer_opportunities(TEXT);
DROP FUNCTION IF EXISTS get_pacer_opportunities(UUID);
CREATE OR REPLACE FUNCTION get_pacer_opportunities(user_id TEXT DEFAULT NULL)
RETURNS TABLE (
  session_id UUID,
  session_name TEXT,
  session_date DATE,
  pace_group_id UUID,
  pace_group_name TEXT,
  target_pace TEXT,
  needs_pacer BOOLEAN
) AS $$
DECLARE
  resolved_user_id UUID;
BEGIN
  -- Resolve the user ID if provided
  IF user_id IS NOT NULL THEN
    resolved_user_id := resolve_user_id(user_id);
  END IF;

  RETURN QUERY
  SELECT 
    s.id as session_id,
    COALESCE(s.title, 'Untitled Session') as session_name,
    s.created_at::date as session_date,
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
  WHERE s.created_at::date >= CURRENT_DATE
  AND (resolved_user_id IS NULL OR pg.id NOT IN (
    SELECT pace_group_id FROM pace_group_pacers_rogues_7a9k2m 
    WHERE user_id = resolved_user_id
  ))
  ORDER BY s.created_at, pg.target_pace;
END;
$$ LANGUAGE plpgsql;

-- 5. Pacer achievements with text user ID support
DROP FUNCTION IF EXISTS get_pacer_achievements(TEXT);
DROP FUNCTION IF EXISTS get_pacer_achievements(UUID);
CREATE OR REPLACE FUNCTION get_pacer_achievements(user_id TEXT)
RETURNS TABLE (
  achievement_type TEXT,
  achievement_name TEXT,
  description TEXT,
  earned_date DATE,
  badge_icon TEXT
) AS $$
DECLARE
  resolved_user_id UUID;
BEGIN
  -- Resolve the user ID
  resolved_user_id := resolve_user_id(user_id);
  
  IF resolved_user_id IS NULL THEN
    -- Return empty results if user not found
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(DISTINCT pg.session_id) as sessions_paced,
      SUM(s.distance) as total_distance,
      COUNT(DISTINCT pg.target_pace) as different_paces
    FROM pace_group_pacers_rogues_7a9k2m pgp
    JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
    JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
    WHERE pgp.user_id = resolved_user_id
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

-- 6. Pacer recognition (fix column names)
DROP FUNCTION IF EXISTS get_pacer_recognition(INTEGER);
CREATE OR REPLACE FUNCTION get_pacer_recognition(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id TEXT,
  user_name TEXT,
  sessions_paced INTEGER,
  total_distance NUMERIC,
  recognition_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pgp.user_id::TEXT,
    COALESCE(
      CASE 
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
        THEN u.first_name || ' ' || u.last_name
        WHEN u.first_name IS NOT NULL 
        THEN u.first_name
        WHEN u.name IS NOT NULL
        THEN u.name
        ELSE COALESCE(u.email, 'Unknown User')
      END
    ) as user_name,
    COUNT(DISTINCT pg.session_id)::INTEGER as sessions_paced,
    COALESCE(SUM(s.distance), 0) as total_distance,
    'top_pacer'::TEXT as recognition_type
  FROM pace_group_pacers_rogues_7a9k2m pgp
  JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
  JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
  LEFT JOIN users_rogues_7a9k2m u ON pgp.user_id = u.id
  WHERE pgp.status = 'confirmed'
  AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY pgp.user_id, u.first_name, u.last_name, u.name, u.email
  ORDER BY sessions_paced DESC, total_distance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Pacer goals progress with text user ID support
DROP FUNCTION IF EXISTS get_pacer_goals_progress(TEXT);
DROP FUNCTION IF EXISTS get_pacer_goals_progress(UUID);
CREATE OR REPLACE FUNCTION get_pacer_goals_progress(user_id TEXT)
RETURNS TABLE (
  goal_type TEXT,
  goal_name TEXT,
  current_progress INTEGER,
  target_value INTEGER,
  progress_percentage INTEGER,
  status TEXT
) AS $$
DECLARE
  resolved_user_id UUID;
BEGIN
  -- Resolve the user ID
  resolved_user_id := resolve_user_id(user_id);
  
  IF resolved_user_id IS NULL THEN
    -- Return empty results if user not found
    RETURN QUERY
    SELECT 
      'monthly'::TEXT as goal_type,
      'Monthly Sessions'::TEXT as goal_name,
      0 as current_progress,
      4 as target_value,
      0 as progress_percentage,
      'not_found'::TEXT as status;
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(DISTINCT pg.session_id) as sessions_paced,
      SUM(s.distance) as total_distance
    FROM pace_group_pacers_rogues_7a9k2m pgp
    JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
    JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
    WHERE pgp.user_id = resolved_user_id
    AND pgp.status = 'confirmed'
    AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
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

-- Add some test data for the Facebook user
DO $$
DECLARE
  facebook_user_uuid UUID;
  test_session_id UUID;
  test_pace_group_id UUID;
BEGIN
  -- Get the Facebook user's UUID
  SELECT id INTO facebook_user_uuid 
  FROM users_rogues_7a9k2m 
  WHERE email = 'facebook_user_1752932890041@facebook.com';
  
  IF facebook_user_uuid IS NOT NULL THEN
    -- Create a test session
    INSERT INTO sessions_rogues_7a9k2m (title, description, session_date, session_time, location, distance)
    VALUES ('Test Pacing Session', 'Test session for Facebook user', CURRENT_DATE + 1, '07:00', 'Test Park', 10.0)
    RETURNING id INTO test_session_id;
    
    -- Create a pace group for this session
    INSERT INTO pace_groups_rogues_7a9k2m (session_id, name, target_pace, max_size)
    VALUES (test_session_id, 'Test Pace Group', '6:00 min/km', 10)
    RETURNING id INTO test_pace_group_id;
    
    -- Add the Facebook user as a pacer
    INSERT INTO pace_group_pacers_rogues_7a9k2m (user_id, pace_group_id, role, status)
    VALUES (facebook_user_uuid, test_pace_group_id, 'pacer', 'confirmed')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;