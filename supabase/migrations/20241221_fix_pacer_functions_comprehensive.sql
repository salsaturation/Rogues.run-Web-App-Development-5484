-- Comprehensive fix for all pacer analytics functions
-- This migration addresses UUID/text ID issues and missing columns

-- Drop existing problematic functions
DROP FUNCTION IF EXISTS get_pacer_opportunities(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_pacer_opportunities(INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_pacer_achievements(TEXT);
DROP FUNCTION IF EXISTS get_pacer_recognition(INTEGER);
DROP FUNCTION IF EXISTS get_pacer_goals_progress(TEXT);

-- Create helper function to resolve user IDs (handles both UUID and text)
CREATE OR REPLACE FUNCTION resolve_user_id(external_user_id TEXT)
RETURNS UUID AS $$
DECLARE
    resolved_id UUID;
BEGIN
    -- Try to parse as UUID first
    BEGIN
        resolved_id := external_user_id::UUID;
        RETURN resolved_id;
    EXCEPTION WHEN invalid_text_representation THEN
        -- If not a UUID, look up in mapping table
        SELECT internal_id INTO resolved_id 
        FROM user_id_mapping 
        WHERE external_id = external_user_id;
        
        IF resolved_id IS NULL THEN
            -- Create new mapping if user doesn't exist
            INSERT INTO user_id_mapping (external_id, internal_id) 
            VALUES (external_user_id, gen_random_uuid())
            RETURNING internal_id INTO resolved_id;
        END IF;
        
        RETURN resolved_id;
    END;
END;
$$ LANGUAGE plpgsql;

-- Fix get_pacer_opportunities function
CREATE OR REPLACE FUNCTION get_pacer_opportunities(user_id_param TEXT DEFAULT NULL, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
    session_id UUID,
    session_name TEXT,
    session_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    pace_group TEXT,
    target_pace INTERVAL,
    opportunity_type TEXT,
    match_score NUMERIC
) AS $$
DECLARE
    resolved_user_id UUID;
BEGIN
    -- Resolve user ID if provided
    IF user_id_param IS NOT NULL THEN
        resolved_user_id := resolve_user_id(user_id_param);
    END IF;

    RETURN QUERY
    SELECT 
        s.id as session_id,
        s.name as session_name,
        s.date as session_date,
        s.location,
        pg.name as pace_group,
        pg.target_pace,
        'pace_match'::TEXT as opportunity_type,
        85.0::NUMERIC as match_score
    FROM sessions_rogues_7a9k2m s
    JOIN pace_groups_rogues_7a9k2m pg ON s.pace_group_id = pg.id
    WHERE s.date > NOW()
    AND (resolved_user_id IS NULL OR s.id NOT IN (
        SELECT session_id 
        FROM session_attendance_rogues_7a9k2m 
        WHERE user_id = resolved_user_id
    ))
    ORDER BY s.date ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fix get_pacer_achievements function
CREATE OR REPLACE FUNCTION get_pacer_achievements(user_id_param TEXT)
RETURNS TABLE(
    achievement_id TEXT,
    achievement_name TEXT,
    achievement_description TEXT,
    earned_date TIMESTAMP WITH TIME ZONE,
    badge_color TEXT
) AS $$
DECLARE
    resolved_user_id UUID;
    session_count INTEGER;
    goal_count INTEGER;
BEGIN
    resolved_user_id := resolve_user_id(user_id_param);

    -- Count user sessions
    SELECT COUNT(*) INTO session_count
    FROM session_attendance_rogues_7a9k2m sa
    WHERE sa.user_id = resolved_user_id AND sa.attended = true;

    -- Count user goals
    SELECT COUNT(*) INTO goal_count
    FROM goals_rogues_7a9k2m g
    WHERE g.user_id = resolved_user_id AND g.status = 'completed';

    RETURN QUERY
    SELECT 
        'first_session'::TEXT as achievement_id,
        'First Session Complete'::TEXT as achievement_name,
        'Completed your first training session'::TEXT as achievement_description,
        NOW() as earned_date,
        'green'::TEXT as badge_color
    WHERE session_count >= 1
    
    UNION ALL
    
    SELECT 
        'goal_achiever'::TEXT as achievement_id,
        'Goal Achiever'::TEXT as achievement_name,
        'Completed your first goal'::TEXT as achievement_description,
        NOW() as earned_date,
        'blue'::TEXT as badge_color
    WHERE goal_count >= 1
    
    UNION ALL
    
    SELECT 
        'consistent_runner'::TEXT as achievement_id,
        'Consistent Runner'::TEXT as achievement_name,
        'Attended 5 or more sessions'::TEXT as achievement_description,
        NOW() as earned_date,
        'gold'::TEXT as badge_color
    WHERE session_count >= 5;
END;
$$ LANGUAGE plpgsql;

-- Fix get_pacer_recognition function
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
        COALESCE(u.full_name, u.email, 'Anonymous User') as user_name,
        'session_leader'::TEXT as recognition_type,
        'Led multiple successful training sessions'::TEXT as description,
        NOW() as earned_date
    FROM users_rogues_7a9k2m u
    JOIN session_attendance_rogues_7a9k2m sa ON u.id = sa.user_id
    WHERE sa.attended = true
    GROUP BY u.id, u.full_name, u.email
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fix get_pacer_goals_progress function
CREATE OR REPLACE FUNCTION get_pacer_goals_progress(user_id_param TEXT)
RETURNS TABLE(
    goal_id UUID,
    goal_title TEXT,
    goal_type TEXT,
    target_value NUMERIC,
    current_value NUMERIC,
    progress_percentage NUMERIC,
    status TEXT,
    target_date DATE
) AS $$
DECLARE
    resolved_user_id UUID;
BEGIN
    resolved_user_id := resolve_user_id(user_id_param);

    RETURN QUERY
    SELECT 
        g.id as goal_id,
        g.title as goal_title,
        g.type as goal_type,
        g.target_value,
        COALESCE(g.current_value, 0) as current_value,
        CASE 
            WHEN g.target_value > 0 THEN (COALESCE(g.current_value, 0) / g.target_value * 100)
            ELSE 0
        END as progress_percentage,
        g.status,
        g.target_date
    FROM goals_rogues_7a9k2m g
    WHERE g.user_id = resolved_user_id
    AND g.status IN ('active', 'in_progress')
    ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION resolve_user_id(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pacer_opportunities(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pacer_achievements(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pacer_recognition(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pacer_goals_progress(TEXT) TO anon, authenticated;

-- Add RLS policies for user_id_mapping table
ALTER TABLE user_id_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON user_id_mapping
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON user_id_mapping
FOR INSERT WITH CHECK (true);