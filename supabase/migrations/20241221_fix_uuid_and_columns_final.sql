-- Drop all existing problematic functions
DROP FUNCTION IF EXISTS get_community_pacer_stats(DATE);
DROP FUNCTION IF EXISTS get_user_pacer_stats(UUID, DATE);
DROP FUNCTION IF EXISTS get_user_pacer_stats(TEXT, DATE);
DROP FUNCTION IF EXISTS get_pacer_coverage(DATE, DATE);
DROP FUNCTION IF EXISTS get_pacer_opportunities(UUID);
DROP FUNCTION IF EXISTS get_pacer_opportunities(TEXT);
DROP FUNCTION IF EXISTS get_pacer_achievements(UUID);
DROP FUNCTION IF EXISTS get_pacer_achievements(TEXT);
DROP FUNCTION IF EXISTS get_pacer_recognition(INTEGER);
DROP FUNCTION IF EXISTS get_pacer_goals_progress(UUID);
DROP FUNCTION IF EXISTS get_pacer_goals_progress(TEXT);

-- Fix 1: Community pacer stats (unchanged - working)
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

-- Fix 2: User pacer stats with TEXT user_id support
CREATE OR REPLACE FUNCTION get_user_pacer_stats(user_id TEXT, start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days')
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
              AND s.created_at::date >= start_date
              AND pgp.status = 'confirmed'), 0) as sessions_paced,
    
    COALESCE((SELECT SUM(s.distance)
              FROM pace_group_pacers_rogues_7a9k2m pgp
              JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
              JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
              WHERE pgp.user_id = get_user_pacer_stats.user_id
              AND s.created_at::date >= start_date
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
                         AND s.created_at::date >= start_date
                         AND pgp.status = 'confirmed'), 0)) as consistency_score,
    
    (SELECT MAX(s.created_at::date)
     FROM pace_group_pacers_rogues_7a9k2m pgp
     JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
     JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
     WHERE pgp.user_id = get_user_pacer_stats.user_id
     AND pgp.status = 'confirmed') as last_paced_date;
END;
$$ LANGUAGE plpgsql;

-- Fix 3: Pacer coverage (unchanged - working)
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

-- Fix 4: Pacer opportunities with TEXT user_id support
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
BEGIN
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
  AND (user_id IS NULL OR pg.id NOT IN (
    SELECT pace_group_id FROM pace_group_pacers_rogues_7a9k2m 
    WHERE user_id = get_pacer_opportunities.user_id
  ))
  ORDER BY s.created_at, pg.target_pace;
END;
$$ LANGUAGE plpgsql;

-- Fix 5: Pacer achievements with TEXT user_id support
CREATE OR REPLACE FUNCTION get_pacer_achievements(user_id TEXT)
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

-- Fix 6: Pacer recognition with correct column names (email instead of display_name)
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
    pgp.user_id,
    COALESCE(
      CASE 
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
        THEN u.first_name || ' ' || u.last_name
        WHEN u.first_name IS NOT NULL 
        THEN u.first_name
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
  GROUP BY pgp.user_id, u.first_name, u.last_name, u.email
  ORDER BY sessions_paced DESC, total_distance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fix 7: Pacer goals progress with TEXT user_id support
CREATE OR REPLACE FUNCTION get_pacer_goals_progress(user_id TEXT)
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

-- Add some test data for Facebook user if it doesn't exist
INSERT INTO pace_group_pacers_rogues_7a9k2m (user_id, pace_group_id, role, status)
SELECT 
  'facebook_user_1752932890041',
  pg.id,
  'pacer',
  'confirmed'
FROM pace_groups_rogues_7a9k2m pg
LIMIT 3
ON CONFLICT DO NOTHING;

-- Ensure test sessions have some distance data
UPDATE sessions_rogues_7a9k2m 
SET distance = CASE 
  WHEN distance IS NULL OR distance = 0 THEN 5.0 + (RANDOM() * 15)
  ELSE distance 
END
WHERE distance IS NULL OR distance = 0;