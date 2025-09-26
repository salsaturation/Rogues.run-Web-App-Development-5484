-- Add completion fields to sessions table
ALTER TABLE sessions_rogues_7a9k2m 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Add attendance tracking fields to session_attendees table
ALTER TABLE session_attendees_rogues_7a9k2m 
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS self_reported BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS self_reported_attended BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS self_reported_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users_rogues_7a9k2m(id),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing attendees to have 'registered' status
UPDATE session_attendees_rogues_7a9k2m 
SET status = 'registered' 
WHERE status IS NULL OR status = 'confirmed';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_attendees_attendance ON session_attendees_rogues_7a9k2m(session_id, attended);
CREATE INDEX IF NOT EXISTS idx_session_attendees_self_reported ON session_attendees_rogues_7a9k2m(session_id, self_reported);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions_rogues_7a9k2m(status, completed_at);

-- Create function to get attendance statistics
CREATE OR REPLACE FUNCTION get_session_attendance_stats(session_uuid UUID)
RETURNS TABLE (
    total_registered INTEGER,
    total_attended INTEGER,
    pending_confirmation INTEGER,
    self_reported_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_registered,
        COUNT(CASE WHEN attended = true THEN 1 END)::INTEGER as total_attended,
        COUNT(CASE WHEN admin_processed = false THEN 1 END)::INTEGER as pending_confirmation,
        COUNT(CASE WHEN self_reported = true THEN 1 END)::INTEGER as self_reported_count
    FROM session_attendees_rogues_7a9k2m 
    WHERE session_id = session_uuid 
    AND status = 'registered';
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-mark sessions as completed (can be called by cron job)
CREATE OR REPLACE FUNCTION auto_complete_past_sessions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Mark sessions as completed if they are 2 hours past their scheduled time
    UPDATE sessions_rogues_7a9k2m 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'confirmed' 
        AND session_date < CURRENT_DATE 
        OR (
            session_date = CURRENT_DATE 
            AND session_time + INTERVAL '2 hours' < CURRENT_TIME
        );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_attendees_updated_at ON session_attendees_rogues_7a9k2m;
CREATE TRIGGER update_session_attendees_updated_at
    BEFORE UPDATE ON session_attendees_rogues_7a9k2m
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to allow attendance management
DROP POLICY IF EXISTS "Enable attendance updates" ON session_attendees_rogues_7a9k2m;
CREATE POLICY "Enable attendance updates" ON session_attendees_rogues_7a9k2m 
FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable attendance inserts" ON session_attendees_rogues_7a9k2m;
CREATE POLICY "Enable attendance inserts" ON session_attendees_rogues_7a9k2m 
FOR INSERT WITH CHECK (true);