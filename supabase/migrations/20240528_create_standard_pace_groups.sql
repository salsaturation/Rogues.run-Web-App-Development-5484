-- Create Standard Pace Groups Table
CREATE TABLE IF NOT EXISTS standard_pace_groups_rogues_7a9k2m (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_pace NUMERIC NOT NULL,
    max_pace NUMERIC NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users_rogues_7a9k2m(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE standard_pace_groups_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable public read access" ON standard_pace_groups_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable insert for admin users" ON standard_pace_groups_rogues_7a9k2m FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users_rogues_7a9k2m
        WHERE id = auth.uid() AND is_admin = true
    )
);
CREATE POLICY "Enable update for admin users" ON standard_pace_groups_rogues_7a9k2m FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users_rogues_7a9k2m
        WHERE id = auth.uid() AND is_admin = true
    )
);
CREATE POLICY "Enable delete for admin users" ON standard_pace_groups_rogues_7a9k2m FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users_rogues_7a9k2m
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Create indexes
CREATE INDEX idx_standard_pace_groups_active ON standard_pace_groups_rogues_7a9k2m(is_active);
CREATE INDEX idx_standard_pace_groups_pace_range ON standard_pace_groups_rogues_7a9k2m(min_pace, max_pace);

-- Insert default standard pace groups
INSERT INTO standard_pace_groups_rogues_7a9k2m (
    name, 
    min_pace, 
    max_pace, 
    description, 
    color,
    icon,
    display_order,
    created_by
) VALUES 
(
    'Speed Demons (4:30-5:00)',
    4.5,
    5.0,
    'Very fast pace for experienced runners',
    'red',
    'bolt',
    1,
    (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
),
(
    'Fast Pacers (5:00-5:30)',
    5.0,
    5.5,
    'Fast pace for strong runners',
    'orange',
    'fire',
    2,
    (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
),
(
    'Swift Group (5:30-6:00)',
    5.5,
    6.0,
    'Good pace for regular runners',
    'yellow',
    'zap',
    3,
    (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
),
(
    'Steady Runners (6:00-6:30)',
    6.0,
    6.5,
    'Moderate pace for regular runners',
    'green',
    'trending-up',
    4,
    (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
),
(
    'Moderate Pacers (6:30-7:00)',
    6.5,
    7.0,
    'Comfortable pace for most runners',
    'blue',
    'activity',
    5,
    (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
),
(
    'Easy Group (7:00-7:30)',
    7.0,
    7.5,
    'Relaxed pace for beginners or recovery runs',
    'purple',
    'heart',
    6,
    (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
),
(
    'Beginners (7:30-8:30)',
    7.5,
    8.5,
    'Perfect for new runners and walkers',
    'teal',
    'smile',
    7,
    (SELECT id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1)
);

-- Add function to match users to pace groups
CREATE OR REPLACE FUNCTION match_user_to_pace_groups(user_uuid UUID)
RETURNS TABLE (
    pace_group_id UUID,
    pace_group_name TEXT,
    match_score INTEGER
) AS $$
DECLARE
    user_prefs JSONB;
BEGIN
    -- Get user pace preferences
    SELECT pace_preferences INTO user_prefs
    FROM users_rogues_7a9k2m
    WHERE id = user_uuid;

    -- Return matching pace groups with scores
    RETURN QUERY
    WITH user_preferences AS (
        SELECT 
            p.value->>'runType' AS run_type,
            (p.value->>'pace')::numeric AS pace
        FROM jsonb_array_elements(user_prefs) AS p
    )
    SELECT 
        spg.id,
        spg.name,
        COUNT(p.*)::integer AS match_score
    FROM 
        standard_pace_groups_rogues_7a9k2m spg,
        user_preferences p
    WHERE 
        spg.is_active = TRUE AND
        p.pace >= spg.min_pace AND 
        p.pace <= spg.max_pace
    GROUP BY 
        spg.id, spg.name
    ORDER BY 
        match_score DESC, spg.display_order ASC;
    
END;
$$ LANGUAGE plpgsql;

-- Add function to suggest pace groups for a session
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
        spg.is_active = TRUE AND
        -- Group has some overlap with the session's pace range
        (
            (spg.min_pace <= session_max_pace AND spg.max_pace >= session_min_pace)
        )
    ORDER BY 
        spg.display_order ASC;
END;
$$ LANGUAGE plpgsql;