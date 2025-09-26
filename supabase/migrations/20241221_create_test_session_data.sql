-- Create a test completed session with attendees to debug the self-report issue

-- First, ensure we have test users
DO $$
DECLARE
  admin_user_id UUID;
  member_user_id UUID;
  test_session_id UUID;
BEGIN
  -- Get admin user
  SELECT id INTO admin_user_id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run';
  
  -- Get member user
  SELECT id INTO member_user_id FROM users_rogues_7a9k2m WHERE email = 'member@rogues.run';
  
  -- Create a test session that's completed
  INSERT INTO sessions_rogues_7a9k2m (
    title, 
    description, 
    session_date, 
    session_time, 
    location, 
    max_attendees, 
    status, 
    created_by,
    completed_at,
    completion_notes
  ) VALUES (
    'Test Completed Session',
    'A test session to verify self-reporting works',
    CURRENT_DATE - 1, -- Yesterday
    '07:00',
    'Test Park',
    20,
    'completed',
    admin_user_id,
    NOW() - INTERVAL '2 hours',
    'Session completed successfully for testing'
  ) RETURNING id INTO test_session_id;

  -- Add member as attendee (not self-reported yet)
  IF member_user_id IS NOT NULL AND test_session_id IS NOT NULL THEN
    INSERT INTO session_attendees_rogues_7a9k2m (
      session_id,
      user_id,
      status,
      joined_at,
      self_reported,
      admin_processed
    ) VALUES (
      test_session_id,
      member_user_id,
      'registered',
      NOW() - INTERVAL '1 day',
      false,
      false
    ) ON CONFLICT (session_id, user_id) DO NOTHING;
  END IF;

  -- Add admin as interested user (not registered attendee)
  IF admin_user_id IS NOT NULL AND test_session_id IS NOT NULL THEN
    INSERT INTO session_interested_users_rogues_7a9k2m (
      session_id,
      user_id,
      created_at
    ) VALUES (
      test_session_id,
      admin_user_id,
      NOW() - INTERVAL '1 day'
    ) ON CONFLICT (session_id, user_id) DO NOTHING;
  END IF;

  RAISE NOTICE 'Created test session with ID: %, Admin user: %, Member user: %', test_session_id, admin_user_id, member_user_id;
END $$;

-- Also update some existing sessions to be completed for testing
UPDATE sessions_rogues_7a9k2m 
SET 
  status = 'completed',
  completed_at = NOW() - INTERVAL '1 hour',
  completion_notes = 'Auto-completed for testing'
WHERE session_date < CURRENT_DATE 
  AND status != 'completed' 
  AND title LIKE '%Morning%'
LIMIT 1;

-- Ensure we have some attendees for the completed sessions
DO $$
DECLARE
  completed_session_id UUID;
  member_user_id UUID;
BEGIN
  -- Get a completed session
  SELECT id INTO completed_session_id 
  FROM sessions_rogues_7a9k2m 
  WHERE status = 'completed' 
  LIMIT 1;
  
  -- Get member user
  SELECT id INTO member_user_id FROM users_rogues_7a9k2m WHERE email = 'member@rogues.run';
  
  -- Add member as attendee if not exists
  IF completed_session_id IS NOT NULL AND member_user_id IS NOT NULL THEN
    INSERT INTO session_attendees_rogues_7a9k2m (
      session_id,
      user_id,
      status,
      joined_at,
      self_reported,
      admin_processed
    ) VALUES (
      completed_session_id,
      member_user_id,
      'registered',
      NOW() - INTERVAL '2 days',
      false,
      false
    ) ON CONFLICT (session_id, user_id) DO NOTHING;
  END IF;
END $$;