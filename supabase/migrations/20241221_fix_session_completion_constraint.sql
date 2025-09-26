-- Update the check constraint to allow 'completed' status
ALTER TABLE sessions_rogues_7a9k2m DROP CONSTRAINT IF EXISTS sessions_rogues_7a9k2m_status_check;
ALTER TABLE sessions_rogues_7a9k2m ADD CONSTRAINT sessions_rogues_7a9k2m_status_check 
  CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed'));

-- Ensure completed sessions have proper completion timestamp
UPDATE sessions_rogues_7a9k2m 
SET completed_at = NOW() 
WHERE status = 'completed' AND completed_at IS NULL;