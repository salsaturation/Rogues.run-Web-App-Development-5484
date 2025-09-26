-- Fix analytics table to handle TEXT user IDs instead of UUID
ALTER TABLE analytics_rogues_7a9k2m 
ALTER COLUMN user_id TYPE TEXT;

-- Drop and recreate policies with proper permissions
DROP POLICY IF EXISTS "Enable public read access" ON analytics_rogues_7a9k2m;
CREATE POLICY "Allow all operations on analytics" ON analytics_rogues_7a9k2m FOR ALL USING (true);

-- Fix user preferences column
ALTER TABLE users_rogues_7a9k2m ADD COLUMN IF NOT EXISTS user_preferences JSONB DEFAULT '{}';

-- Fix session attendees table structure
ALTER TABLE session_attendees_rogues_7a9k2m 
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS self_reported BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS self_reported_attended BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS self_reported_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS confirmed_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records
UPDATE session_attendees_rogues_7a9k2m 
SET status = 'registered' 
WHERE status IS NULL OR status = '';

-- Create comprehensive policies for session_attendees
DROP POLICY IF EXISTS "Enable public read access" ON session_attendees_rogues_7a9k2m;
DROP POLICY IF EXISTS "Enable attendance updates" ON session_attendees_rogues_7a9k2m;
DROP POLICY IF EXISTS "Enable attendance inserts" ON session_attendees_rogues_7a9k2m;
CREATE POLICY "Allow all operations on session_attendees" ON session_attendees_rogues_7a9k2m FOR ALL USING (true);

-- Create or replace the function to get session attendance
CREATE OR REPLACE FUNCTION get_session_attendance_data(session_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_picture TEXT,
    status TEXT,
    joined_at TIMESTAMP WITH TIME ZONE,
    attended BOOLEAN,
    admin_processed BOOLEAN,
    self_reported BOOLEAN,
    self_reported_attended BOOLEAN,
    self_reported_at TIMESTAMP WITH TIME ZONE,
    confirmed_by_name TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.user_id,
        u.name as user_name,
        u.email as user_email,
        u.picture as user_picture,
        sa.status,
        sa.joined_at,
        sa.attended,
        sa.admin_processed,
        sa.self_reported,
        sa.self_reported_attended,
        sa.self_reported_at,
        cb.name as confirmed_by_name,
        sa.confirmed_at
    FROM session_attendees_rogues_7a9k2m sa
    LEFT JOIN users_rogues_7a9k2m u ON sa.user_id = u.id
    LEFT JOIN users_rogues_7a9k2m cb ON sa.confirmed_by = cb.id
    WHERE sa.session_id = session_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user profile by email
CREATE OR REPLACE FUNCTION update_user_profile(
    user_email TEXT,
    user_name TEXT DEFAULT NULL,
    user_phone TEXT DEFAULT NULL,
    user_location TEXT DEFAULT NULL,
    user_bio TEXT DEFAULT NULL,
    user_pace_preferences JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE users_rogues_7a9k2m 
    SET 
        name = COALESCE(user_name, name),
        phone = COALESCE(user_phone, phone),
        location = COALESCE(user_location, location),
        bio = COALESCE(user_bio, bio),
        pace_preferences = COALESCE(user_pace_preferences, pace_preferences),
        updated_at = NOW()
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_attendees_session_user ON session_attendees_rogues_7a9k2m(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_session_attendees_status ON session_attendees_rogues_7a9k2m(status);
CREATE INDEX IF NOT EXISTS idx_session_attendees_attendance ON session_attendees_rogues_7a9k2m(attended, admin_processed);