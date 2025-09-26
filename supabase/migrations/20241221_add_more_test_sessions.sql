-- Add more diverse sessions to test the recommended sessions feature and populate the dashboard

DO $$
DECLARE
    admin_user_id UUID;
    publisher_user_id UUID;
    member_user_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO admin_user_id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run';
    SELECT id INTO publisher_user_id FROM users_rogues_7a9k2m WHERE email = 'publisher@rogues.run';
    SELECT id INTO member_user_id FROM users_rogues_7a9k2m WHERE email = 'member@rogues.run';

    -- Add pace preferences to the member user to test recommendations
    UPDATE users_rogues_7a9k2m 
    SET pace_preferences = '[
        {"id": 1, "pace": 6.0, "runType": "easy"},
        {"id": 2, "pace": 5.5, "runType": "tempo"},
        {"id": 3, "pace": 7.0, "runType": "long-slow"}
    ]'::jsonb
    WHERE email = 'member@rogues.run';

    -- Add more upcoming sessions with variety
    INSERT INTO sessions_rogues_7a9k2m (
        title, description, session_date, session_time, end_time, location,
        max_attendees, status, created_by, start_location_name, route_type,
        total_distance, run_type, pace_min, pace_max, difficulty,
        special_instructions, required_gear
    ) VALUES
    -- Tomorrow sessions
    (
        'Tuesday Tempo Run',
        'Mid-week tempo session to build lactate threshold. Perfect for improving race pace.',
        CURRENT_DATE + 1,
        '18:00',
        '19:15',
        'Riverside Track',
        15,
        'confirmed',
        publisher_user_id,
        'Riverside Track Main Entrance',
        'structured',
        6,
        'tempo',
        5.0,
        6.0,
        'intermediate',
        'Warm up for 15 minutes, then 20 minutes at tempo pace, cool down for 10 minutes.',
        ARRAY['Running shoes', 'Water bottle', 'Heart rate monitor']
    ),
    (
        'Wednesday Recovery Run',
        'Easy recovery run to help your muscles recover while maintaining fitness.',
        CURRENT_DATE + 2,
        '07:30',
        '08:30',
        'Park Loop Trail',
        20,
        'confirmed',
        admin_user_id,
        'Park Loop Trail South Gate',
        'flexible',
        4,
        'easy',
        6.5,
        7.5,
        'beginner',
        'Keep it conversational pace. This is an active recovery session.',
        ARRAY['Running shoes', 'Water bottle']
    ),
    (
        'Thursday Hill Repeats',
        'Short hill repeats for building power and strength. Great for all levels.',
        CURRENT_DATE + 3,
        '18:30',
        '19:45',
        'Hill Training Park',
        18,
        'confirmed',
        admin_user_id,
        'Hill Training Park North Entrance',
        'structured',
        7,
        'interval',
        4.5,
        6.5,
        'intermediate',
        '6x 2-minute hill repeats with easy jog recovery. Focus on form and effort.',
        ARRAY['Running shoes with good grip', 'Water bottle', 'Towel']
    ),
    -- Weekend sessions
    (
        'Saturday Long Run',
        'Weekend long run with multiple pace groups. Build your endurance and enjoy the company.',
        CURRENT_DATE + 4,
        '08:00',
        '10:00',
        'Coastal Trail',
        25,
        'confirmed',
        publisher_user_id,
        'Coastal Trail Visitor Center',
        'predefined',
        12,
        'long-slow',
        6.0,
        7.5,
        'intermediate',
        'Multiple distance options: 8km, 12km, 16km. Water stations at 4km and 8km.',
        ARRAY['Running shoes', 'Water bottle', 'Energy gels', 'Phone']
    ),
    (
        'Sunday Social Run & Coffee',
        'Relaxed social run followed by coffee and chat. Perfect for newcomers!',
        CURRENT_DATE + 5,
        '09:00',
        '10:30',
        'City Park',
        30,
        'confirmed',
        member_user_id,
        'City Park Main Entrance',
        'flexible',
        5,
        'easy',
        6.5,
        8.0,
        'beginner',
        'Easy pace run followed by coffee at the nearby café. Great for meeting new people!',
        ARRAY['Running shoes', 'Water bottle', 'Small amount of cash for coffee']
    ),
    -- Next week sessions
    (
        'Monday Speed Work',
        'Track session focusing on 400m and 800m intervals. Improve your speed and running economy.',
        CURRENT_DATE + 7,
        '18:00',
        '19:30',
        'Athletic Track',
        12,
        'confirmed',
        admin_user_id,
        'Athletic Track Main Gate',
        'structured',
        8,
        'interval',
        4.0,
        5.5,
        'advanced',
        '8x 400m at 5K pace with 90 sec recovery, then 4x 800m at 10K pace with 2 min recovery.',
        ARRAY['Running spikes or flats', 'Water bottle', 'Stopwatch']
    ),
    (
        'Tuesday Trail Adventure',
        'Explore scenic trails with varied terrain. A fun way to mix up your training.',
        CURRENT_DATE + 8,
        '17:30',
        '19:00',
        'Mountain Trail Head',
        20,
        'confirmed',
        publisher_user_id,
        'Mountain Trail Head Parking',
        'predefined',
        10,
        'trail',
        6.0,
        8.0,
        'intermediate',
        'Mixed terrain with hills and technical sections. Headlamp recommended for finish.',
        ARRAY['Trail running shoes', 'Water bottle', 'Headlamp', 'First aid basics']
    ),
    (
        'Wednesday Morning Meditation Run',
        'Mindful running session combining meditation with easy movement.',
        CURRENT_DATE + 9,
        '06:30',
        '07:30',
        'Quiet Lake Path',
        15,
        'confirmed',
        member_user_id,
        'Quiet Lake Path East Entrance',
        'flexible',
        4,
        'easy',
        7.0,
        8.5,
        'beginner',
        'Focus on breathing and mindfulness. We will include walking meditation breaks.',
        ARRAY['Comfortable running shoes', 'Water bottle', 'Open mind']
    ),
    -- Past completed sessions for testing attendance
    (
        'Last Week Easy Run',
        'Completed easy run from last week.',
        CURRENT_DATE - 7,
        '07:00',
        '08:00',
        'Morning Park',
        20,
        'completed',
        admin_user_id,
        'Morning Park Main Gate',
        'flexible',
        5,
        'easy',
        6.0,
        7.0,
        'beginner',
        'Great turnout for our weekly easy run!',
        ARRAY['Running shoes', 'Water bottle']
    ),
    (
        'Weekend Long Run - Completed',
        'Successfully completed long run with great participation.',
        CURRENT_DATE - 3,
        '08:30',
        '10:30',
        'Long Distance Trail',
        15,
        'completed',
        publisher_user_id,
        'Long Distance Trail Start',
        'predefined',
        15,
        'long-slow',
        6.5,
        7.5,
        'intermediate',
        'Excellent weather and great group spirit!',
        ARRAY['Running shoes', 'Water bottle', 'Energy gels']
    );

    -- Add attendees to some sessions to make them more realistic
    -- Add attendees to upcoming sessions
    INSERT INTO session_attendees_rogues_7a9k2m (session_id, user_id, status, joined_at)
    SELECT s.id, admin_user_id, 'registered', NOW() - INTERVAL '2 days'
    FROM sessions_rogues_7a9k2m s
    WHERE s.session_date >= CURRENT_DATE AND s.title LIKE '%Tempo%'
    ON CONFLICT (session_id, user_id) DO NOTHING;

    INSERT INTO session_attendees_rogues_7a9k2m (session_id, user_id, status, joined_at)
    SELECT s.id, member_user_id, 'registered', NOW() - INTERVAL '1 day'
    FROM sessions_rogues_7a9k2m s
    WHERE s.session_date >= CURRENT_DATE AND s.title LIKE '%Recovery%'
    ON CONFLICT (session_id, user_id) DO NOTHING;

    INSERT INTO session_attendees_rogues_7a9k2m (session_id, user_id, status, joined_at)
    SELECT s.id, publisher_user_id, 'registered', NOW() - INTERVAL '3 hours'
    FROM sessions_rogues_7a9k2m s
    WHERE s.session_date >= CURRENT_DATE AND s.title LIKE '%Long Run%'
    ON CONFLICT (session_id, user_id) DO NOTHING;

    -- Add some interested users
    INSERT INTO session_interested_users_rogues_7a9k2m (session_id, user_id, created_at)
    SELECT s.id, member_user_id, NOW() - INTERVAL '1 day'
    FROM sessions_rogues_7a9k2m s
    WHERE s.session_date >= CURRENT_DATE AND s.title LIKE '%Hill%'
    ON CONFLICT (session_id, user_id) DO NOTHING;

    INSERT INTO session_interested_users_rogues_7a9k2m (session_id, user_id, created_at)
    SELECT s.id, admin_user_id, NOW() - INTERVAL '2 hours'
    FROM sessions_rogues_7a9k2m s
    WHERE s.session_date >= CURRENT_DATE AND s.title LIKE '%Social%'
    ON CONFLICT (session_id, user_id) DO NOTHING;

    -- Add attendees to completed sessions for testing attendance management
    INSERT INTO session_attendees_rogues_7a9k2m (session_id, user_id, status, joined_at, self_reported, admin_processed)
    SELECT s.id, member_user_id, 'registered', NOW() - INTERVAL '1 week', false, false
    FROM sessions_rogues_7a9k2m s
    WHERE s.status = 'completed' AND s.title LIKE '%Last Week%'
    ON CONFLICT (session_id, user_id) DO NOTHING;

    INSERT INTO session_attendees_rogues_7a9k2m (session_id, user_id, status, joined_at, attended, admin_processed, confirmed_by, confirmed_at)
    SELECT s.id, publisher_user_id, 'registered', NOW() - INTERVAL '4 days', true, true, admin_user_id, NOW() - INTERVAL '1 day'
    FROM sessions_rogues_7a9k2m s
    WHERE s.status = 'completed' AND s.title LIKE '%Weekend Long%'
    ON CONFLICT (session_id, user_id) DO NOTHING;

    -- Update completion timestamps for completed sessions
    UPDATE sessions_rogues_7a9k2m 
    SET completed_at = session_date + session_time + INTERVAL '2 hours',
        completion_notes = 'Session completed successfully with great participation!'
    WHERE status = 'completed' AND completed_at IS NULL;

    RAISE NOTICE 'Added diverse sessions and attendance data for testing';
END $$;

-- Update some user stats to make dashboard more interesting
UPDATE users_rogues_7a9k2m 
SET sessions_attended = 8, 
    last_active = NOW() - INTERVAL '2 hours'
WHERE email = 'member@rogues.run';

UPDATE users_rogues_7a9k2m 
SET sessions_attended = 15, 
    last_active = NOW() - INTERVAL '1 hour'
WHERE email = 'admin@rogues.run';

UPDATE users_rogues_7a9k2m 
SET sessions_attended = 12, 
    last_active = NOW() - INTERVAL '30 minutes'
WHERE email = 'publisher@rogues.run';