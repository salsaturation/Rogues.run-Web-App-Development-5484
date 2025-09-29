-- Enhance the pacer system with better volunteer management

-- Update pace_group_pacers table to include volunteer timestamp
ALTER TABLE pace_group_pacers_rogues_7a9k2m 
ADD COLUMN IF NOT EXISTS volunteered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users_rogues_7a9k2m(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create function to volunteer as pacer (with auto-attendance)
CREATE OR REPLACE FUNCTION volunteer_as_pacer(
    p_session_id UUID,
    p_group_id UUID, 
    p_user_id UUID,
    p_role TEXT DEFAULT 'primary'
) RETURNS BOOLEAN AS $$
BEGIN
    -- First, ensure user is attending the session
    INSERT INTO session_attendees_rogues_7a9k2m (session_id, user_id, status, joined_at)
    VALUES (p_session_id, p_user_id, 'registered', NOW())
    ON CONFLICT (session_id, user_id) DO NOTHING;
    
    -- Then add as pacer volunteer
    INSERT INTO pace_group_pacers_rogues_7a9k2m (
        pace_group_id, 
        user_id, 
        role, 
        status, 
        volunteered_at
    ) VALUES (
        p_group_id, 
        p_user_id, 
        p_role, 
        'pending', 
        NOW()
    ) ON CONFLICT (pace_group_id, user_id) DO UPDATE SET
        role = p_role,
        status = 'pending',
        volunteered_at = NOW();
        
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to approve pacer volunteer
CREATE OR REPLACE FUNCTION approve_pacer_volunteer(
    p_group_id UUID,
    p_user_id UUID,
    p_approved_by UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE pace_group_pacers_rogues_7a9k2m 
    SET 
        status = 'confirmed',
        approved_by = p_approved_by,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE pace_group_id = p_group_id 
    AND user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user pacer status for a session
CREATE OR REPLACE FUNCTION get_user_pacer_status(
    p_session_id UUID,
    p_user_id UUID
) RETURNS TABLE (
    group_id UUID,
    group_name TEXT,
    role TEXT,
    status TEXT,
    volunteered_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg.id as group_id,
        pg.name as group_name,
        pgp.role,
        pgp.status,
        pgp.volunteered_at
    FROM pace_groups_rogues_7a9k2m pg
    JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
    WHERE pg.session_id = p_session_id 
    AND pgp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add some test pace groups to existing sessions for demonstration
DO $$
DECLARE
    admin_user_id UUID;
    member_user_id UUID;
    session_id UUID;
    group_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO admin_user_id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run';
    SELECT id INTO member_user_id FROM users_rogues_7a9k2m WHERE email = 'member@rogues.run';
    
    -- Get a future session for testing
    SELECT id INTO session_id 
    FROM sessions_rogues_7a9k2m 
    WHERE session_date >= CURRENT_DATE 
    AND title LIKE '%Tempo%' 
    LIMIT 1;
    
    IF session_id IS NOT NULL THEN
        -- Create pace groups for this session
        INSERT INTO pace_groups_rogues_7a9k2m (
            session_id, name, min_pace, max_pace, description, required_pacers, shadow_slots
        ) VALUES 
        (session_id, 'Fast Group (5:00-5:30)', 5.0, 5.5, 'For experienced runners', 1, 1),
        (session_id, 'Medium Group (5:30-6:00)', 5.5, 6.0, 'Regular pace group', 2, 1),
        (session_id, 'Comfortable Group (6:00-6:30)', 6.0, 6.5, 'Comfortable pace', 1, 2)
        ON CONFLICT DO NOTHING
        RETURNING id INTO group_id;
        
        -- Add admin as a confirmed pacer for the first group
        IF group_id IS NOT NULL THEN
            INSERT INTO pace_group_pacers_rogues_7a9k2m (
                pace_group_id, user_id, role, status, approved_by, approved_at
            ) VALUES (
                group_id, admin_user_id, 'primary', 'confirmed', admin_user_id, NOW()
            ) ON CONFLICT (pace_group_id, user_id) DO NOTHING;
        END IF;
    END IF;
    
    -- Get another session for long run
    SELECT id INTO session_id 
    FROM sessions_rogues_7a9k2m 
    WHERE session_date >= CURRENT_DATE 
    AND title LIKE '%Long Run%' 
    LIMIT 1;
    
    IF session_id IS NOT NULL THEN
        -- Create pace groups for long run
        INSERT INTO pace_groups_rogues_7a9k2m (
            session_id, name, min_pace, max_pace, description, required_pacers, shadow_slots
        ) VALUES 
        (session_id, 'Steady Group (6:00-6:30)', 6.0, 6.5, 'Steady long run pace', 2, 1),
        (session_id, 'Easy Group (6:30-7:00)', 6.5, 7.0, 'Easy conversational pace', 2, 2),
        (session_id, 'Beginner Group (7:00-7:30)', 7.0, 7.5, 'Perfect for beginners', 1, 1)
        ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE 'Added pace groups and test pacer data';
END $$;

-- Update RLS policies to allow pacer operations
DROP POLICY IF EXISTS "Enable public read access" ON pace_group_pacers_rogues_7a9k2m;
DROP POLICY IF EXISTS "Allow pacer operations" ON pace_group_pacers_rogues_7a9k2m;

CREATE POLICY "Allow all pacer operations" ON pace_group_pacers_rogues_7a9k2m 
FOR ALL USING (true);

-- Add Strava configuration to club settings if not exists
ALTER TABLE club_settings_rogues_7a9k2m 
ADD COLUMN IF NOT EXISTS strava_config JSONB DEFAULT '{}';

-- Update club settings with default Strava config
UPDATE club_settings_rogues_7a9k2m 
SET strava_config = '{
    "clientId": "",
    "clientSecret": "",
    "clubId": "",
    "syncFrequency": "daily",
    "autoSyncEnabled": true,
    "webhooksEnabled": false,
    "connectionVerified": false
}'::jsonb
WHERE strava_config = '{}' OR strava_config IS NULL;