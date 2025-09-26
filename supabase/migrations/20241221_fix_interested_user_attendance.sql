-- Update the get_session_attendance_data function to include interested users who can self-report
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

-- Add a special status for interested users who self-report
-- Update the check constraint to allow 'interested' status for attendees
ALTER TABLE session_attendees_rogues_7a9k2m DROP CONSTRAINT IF EXISTS session_attendees_rogues_7a9k2m_status_check;
ALTER TABLE session_attendees_rogues_7a9k2m ADD CONSTRAINT session_attendees_rogues_7a9k2m_status_check 
  CHECK (status IN ('registered', 'confirmed', 'cancelled', 'interested'));

-- Update existing records to ensure they have proper status
UPDATE session_attendees_rogues_7a9k2m 
SET status = 'registered' 
WHERE status IS NULL OR status = '';

-- Create comprehensive RLS policies
DROP POLICY IF EXISTS "Allow all operations on session_attendees" ON session_attendees_rogues_7a9k2m;
CREATE POLICY "Allow all operations on session_attendees" ON session_attendees_rogues_7a9k2m FOR ALL USING (true);

-- Create comprehensive RLS policies for interested users table
DROP POLICY IF EXISTS "Enable public read access" ON session_interested_users_rogues_7a9k2m;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON session_interested_users_rogues_7a9k2m;
DROP POLICY IF EXISTS "Enable delete for users" ON session_interested_users_rogues_7a9k2m;

CREATE POLICY "Allow all operations on session_interested" ON session_interested_users_rogues_7a9k2m FOR ALL USING (true);