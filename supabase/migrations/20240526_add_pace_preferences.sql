-- Add pace_preferences column to users table
ALTER TABLE users_rogues_7a9k2m ADD COLUMN IF NOT EXISTS pace_preferences JSONB DEFAULT '[]'::jsonb;

-- Create index for faster querying by pace preferences
CREATE INDEX IF NOT EXISTS idx_users_pace_preferences ON users_rogues_7a9k2m USING gin (pace_preferences);

-- Add function to recommend sessions based on pace preferences
CREATE OR REPLACE FUNCTION recommend_sessions_by_pace(user_uuid UUID) 
RETURNS TABLE (
  session_id UUID,
  title TEXT,
  session_date DATE,
  session_time TIME,
  pace_min NUMERIC,
  pace_max NUMERIC,
  run_type TEXT,
  match_score INTEGER
) AS $$
DECLARE
  user_prefs JSONB;
BEGIN
  -- Get user pace preferences
  SELECT pace_preferences INTO user_prefs FROM users_rogues_7a9k2m WHERE id = user_uuid;
  
  -- Return matching sessions
  RETURN QUERY
  WITH user_preferences AS (
    SELECT 
      p.value->>'runType' AS run_type,
      (p.value->>'pace')::numeric AS pace
    FROM jsonb_array_elements(user_prefs) AS p
  )
  SELECT 
    s.id,
    s.title,
    s.session_date,
    s.session_time,
    s.pace_min,
    s.pace_max,
    s.run_type,
    COUNT(p.*)::integer AS match_score
  FROM 
    sessions_rogues_7a9k2m s,
    user_preferences p
  WHERE 
    s.session_date >= CURRENT_DATE
    AND (s.run_type = p.run_type OR s.run_type IS NULL)
    AND p.pace >= s.pace_min
    AND p.pace <= s.pace_max
  GROUP BY 
    s.id, s.title, s.session_date, s.session_time, s.pace_min, s.pace_max, s.run_type
  ORDER BY 
    match_score DESC, s.session_date ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;