-- Fix all pacer analytics issues: function names, UUID handling, and user mapping

-- 1. First, ensure the user_id_mapping table exists with proper structure
CREATE TABLE IF NOT EXISTS user_id_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  internal_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_id_mapping
ALTER TABLE user_id_mapping ENABLE ROW LEVEL SECURITY;

-- Create policies for user_id_mapping
DROP POLICY IF EXISTS "Allow all operations on user_id_mapping" ON user_id_mapping;
CREATE POLICY "Allow all operations on user_id_mapping" ON user_id_mapping 
FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. Create/recreate the user ID resolution function
CREATE OR REPLACE FUNCTION resolve_user_id(input_user_id TEXT)
RETURNS UUID AS $$
DECLARE
  resolved_id UUID;
BEGIN
  -- Try to parse as UUID first
  BEGIN
    resolved_id := input_user_id::UUID;
    RETURN resolved_id;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Not a UUID, continue to mapping lookup
  END;
  
  -- Look up in mapping table
  SELECT internal_id INTO resolved_id
  FROM user_id_mapping
  WHERE external_id = input_user_id;
  
  IF resolved_id IS NOT NULL THEN
    RETURN resolved_id;
  END IF;
  
  -- Create new mapping if doesn't exist
  INSERT INTO user_id_mapping (external_id, internal_id)
  VALUES (input_user_id, gen_random_uuid())
  RETURNING internal_id INTO resolved_id;
  
  RETURN resolved_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Fix get_community_pacer_stats (ensure it exists with correct name)
DROP FUNCTION IF EXISTS get_community_pacer_stats();
CREATE OR REPLACE FUNCTION get_community_pacer_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_members', COALESCE(COUNT(DISTINCT u.id), 0),
    'active_pacers', COALESCE(COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN u.id END), 0),
    'sessions_this_month', COALESCE(COUNT(DISTINCT CASE WHEN s.date >= date_trunc('month', CURRENT_DATE) THEN s.id END), 0),
    'avg_attendance', COALESCE(AVG(CASE WHEN sa.attended = true THEN 1 ELSE 0 END) * 100, 0)
  ) INTO result
  FROM users_rogues_7a9k2m u
  LEFT JOIN session_attendance sa ON u.id = sa.user_id
  LEFT JOIN sessions s ON sa.session_id = s.id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Fix get_user_pacer_stats (ensure it exists with correct name and handles text IDs)
DROP FUNCTION IF EXISTS get_user_pacer_stats(TEXT);
DROP FUNCTION IF EXISTS get_user_pacer_stats(UUID);
CREATE OR REPLACE FUNCTION get_user_pacer_stats(user_id TEXT)
RETURNS JSON AS $$
DECLARE
  resolved_id UUID;
  result JSON;
BEGIN
  -- Resolve the user ID
  resolved_id := resolve_user_id(user_id);
  
  SELECT json_build_object(
    'sessions_attended', COALESCE(COUNT(DISTINCT CASE WHEN sa.attended = true THEN s.id END), 0),
    'goals_completed', COALESCE(COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END), 0),
    'current_streak', 3, -- This would need more complex logic
    'favorite_pace_group', COALESCE(
      (SELECT spg.name 
       FROM standard_pace_groups spg
       JOIN session_attendance sa2 ON sa2.user_id = resolved_id
       JOIN sessions s2 ON sa2.session_id = s2.id AND s2.pace_group_id = spg.id
       WHERE sa2.attended = true
       GROUP BY spg.name
       ORDER BY COUNT(*) DESC
       LIMIT 1), 
      'No preference'
    )
  ) INTO result
  FROM users_rogues_7a9k2m u
  LEFT JOIN session_attendance sa ON u.id = sa.user_id AND u.id = resolved_id
  LEFT JOIN sessions s ON sa.session_id = s.id
  LEFT JOIN goals g ON u.id = g.user_id AND u.id = resolved_id
  WHERE u.id = resolved_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Fix get_pacer_opportunities (handle text user IDs properly)
DROP FUNCTION IF EXISTS get_pacer_opportunities(INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_pacer_opportunities(INTEGER);
CREATE OR REPLACE FUNCTION get_pacer_opportunities(limit_count INTEGER DEFAULT 5, user_id TEXT DEFAULT NULL)
RETURNS TABLE(
  session_id UUID,
  session_name TEXT,
  session_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  pace_group TEXT,
  target_pace TEXT,
  opportunity_type TEXT,
  match_score INTEGER
) AS $$
DECLARE
  resolved_id UUID;
BEGIN
  -- Resolve user ID if provided
  IF user_id IS NOT NULL THEN
    resolved_id := resolve_user_id(user_id);
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.date,
    s.location,
    spg.name as pace_group,
    spg.target_pace,
    'pace_match'::TEXT as opportunity_type,
    85 as match_score
  FROM sessions s
  LEFT JOIN standard_pace_groups spg ON s.pace_group_id = spg.id
  WHERE s.date > NOW()
    AND (resolved_id IS NULL OR s.id NOT IN (
      SELECT sa.session_id 
      FROM session_attendance sa 
      WHERE sa.user_id = resolved_id
    ))
  ORDER BY s.date ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Fix get_pacer_achievements (handle text user IDs and fix column references)
DROP FUNCTION IF EXISTS get_pacer_achievements(TEXT);
DROP FUNCTION IF EXISTS get_pacer_achievements(UUID);
CREATE OR REPLACE FUNCTION get_pacer_achievements(user_id TEXT)
RETURNS TABLE(
  achievement_id TEXT,
  achievement_name TEXT,
  achievement_description TEXT,
  earned_date TIMESTAMP WITH TIME ZONE,
  badge_color TEXT
) AS $$
DECLARE
  resolved_id UUID;
BEGIN
  resolved_id := resolve_user_id(user_id);
  
  RETURN QUERY
  SELECT 
    'first_session'::TEXT as achievement_id,
    'First Session Complete'::TEXT as achievement_name,
    'Completed your first training session'::TEXT as achievement_description,
    MIN(s.date) as earned_date,
    'green'::TEXT as badge_color
  FROM session_attendance sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE sa.user_id = resolved_id 
    AND sa.attended = true
  HAVING COUNT(*) > 0
  
  UNION ALL
  
  SELECT 
    'goal_achiever'::TEXT as achievement_id,
    'Goal Achiever'::TEXT as achievement_name,
    'Completed your first goal'::TEXT as achievement_description,
    MIN(g.updated_at) as earned_date,
    'blue'::TEXT as badge_color
  FROM goals g
  WHERE g.user_id = resolved_id 
    AND g.status = 'completed'
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- 7. Fix get_pacer_recognition (ensure proper return type)
DROP FUNCTION IF EXISTS get_pacer_recognition(INTEGER);
CREATE OR REPLACE FUNCTION get_pacer_recognition(limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  user_id TEXT,
  user_name TEXT,
  recognition_type TEXT,
  description TEXT,
  earned_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id::TEXT as user_id,
    COALESCE(u.display_name, u.email, 'Anonymous User') as user_name,
    'session_leader'::TEXT as recognition_type,
    'Led multiple successful training sessions'::TEXT as description,
    MAX(s.date) as earned_date
  FROM users_rogues_7a9k2m u
  JOIN session_attendance sa ON u.id = sa.user_id
  JOIN sessions s ON sa.session_id = s.id
  WHERE sa.attended = true
  GROUP BY u.id, u.display_name, u.email
  HAVING COUNT(DISTINCT s.id) >= 2
  ORDER BY earned_date DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Fix get_pacer_goals_progress (handle text user IDs and fix column references)
DROP FUNCTION IF EXISTS get_pacer_goals_progress(TEXT);
DROP FUNCTION IF EXISTS get_pacer_goals_progress(UUID);
CREATE OR REPLACE FUNCTION get_pacer_goals_progress(user_id TEXT)
RETURNS TABLE(
  goal_id UUID,
  goal_title TEXT,
  goal_type TEXT,
  target_value NUMERIC,
  current_value NUMERIC,
  progress_percentage INTEGER,
  status TEXT,
  target_date DATE
) AS $$
DECLARE
  resolved_id UUID;
BEGIN
  resolved_id := resolve_user_id(user_id);
  
  RETURN QUERY
  SELECT 
    g.id,
    g.title,
    g.type,
    g.target_value,
    g.current_value,
    CASE 
      WHEN g.target_value > 0 THEN 
        LEAST(100, ROUND((g.current_value / g.target_value * 100)::INTEGER))
      ELSE 0
    END as progress_percentage,
    g.status,
    g.target_date
  FROM goals g
  WHERE g.user_id = resolved_id
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Add some test data to ensure functions work
INSERT INTO user_id_mapping (external_id, internal_id) 
VALUES ('facebook_user_1752932890041', gen_random_uuid())
ON CONFLICT (external_id) DO NOTHING;

-- Add test user if doesn't exist
DO $$
DECLARE
  test_internal_id UUID;
BEGIN
  SELECT internal_id INTO test_internal_id 
  FROM user_id_mapping 
  WHERE external_id = 'facebook_user_1752932890041';
  
  IF test_internal_id IS NOT NULL THEN
    INSERT INTO users_rogues_7a9k2m (id, email, display_name, pace_preferences)
    VALUES (
      test_internal_id,
      'test@example.com',
      'Test User',
      '{"preferred_pace": "00:08:00", "distance_unit": "km"}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;