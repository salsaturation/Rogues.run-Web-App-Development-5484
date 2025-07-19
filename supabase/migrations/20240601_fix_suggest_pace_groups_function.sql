-- This function helps suggest appropriate pace groups for a session based on the session's pace range
CREATE OR REPLACE FUNCTION suggest_pace_groups_for_session(session_min_pace NUMERIC, session_max_pace NUMERIC)
RETURNS TABLE (
  id UUID,
  name TEXT,
  min_pace NUMERIC,
  max_pace NUMERIC,
  description TEXT,
  color TEXT,
  icon TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    spg.id,
    spg.name,
    spg.min_pace,
    spg.max_pace,
    spg.description,
    spg.color,
    spg.icon
  FROM 
    standard_pace_groups_rogues_7a9k2m spg
  WHERE 
    spg.is_active = TRUE
    AND -- Group has some overlap with the session's pace range
    (
      (spg.min_pace <= session_max_pace AND spg.max_pace >= session_min_pace)
    )
  ORDER BY 
    spg.display_order ASC;
END;
$$ LANGUAGE plpgsql;