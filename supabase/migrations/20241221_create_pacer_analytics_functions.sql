-- Create comprehensive pacer analytics functions for dashboard

-- Function to get community pacer stats
CREATE OR REPLACE FUNCTION get_community_pacer_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '1 month'
) RETURNS TABLE (
    total_pacer_shifts INTEGER,
    unique_pacers INTEGER,
    total_miles_paced NUMERIC,
    average_sessions_per_pacer NUMERIC,
    most_active_pacer_name TEXT,
    most_active_pacer_shifts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH pacer_stats AS (
        SELECT 
            pgp.user_id,
            u.name as user_name,
            COUNT(*) as shifts,
            COALESCE(SUM(s.total_distance), 0) as total_distance
        FROM pace_group_pacers_rogues_7a9k2m pgp
        JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
        JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
        JOIN users_rogues_7a9k2m u ON pgp.user_id = u.id
        WHERE pgp.status = 'confirmed'
        AND s.session_date >= start_date
        AND s.status = 'completed'
        GROUP BY pgp.user_id, u.name
    ),
    summary_stats AS (
        SELECT 
            SUM(shifts)::INTEGER as total_shifts,
            COUNT(DISTINCT user_id)::INTEGER as unique_users,
            SUM(total_distance) as total_distance,
            AVG(shifts) as avg_sessions
        FROM pacer_stats
    ),
    top_pacer AS (
        SELECT user_name, shifts
        FROM pacer_stats
        ORDER BY shifts DESC
        LIMIT 1
    )
    SELECT 
        COALESCE(ss.total_shifts, 0),
        COALESCE(ss.unique_users, 0),
        COALESCE(ss.total_distance, 0),
        COALESCE(ss.avg_sessions, 0),
        COALESCE(tp.user_name, 'None'),
        COALESCE(tp.shifts, 0)
    FROM summary_stats ss
    FULL OUTER JOIN top_pacer tp ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's personal pacer stats
CREATE OR REPLACE FUNCTION get_user_pacer_stats(
    user_id UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '1 month'
) RETURNS TABLE (
    primary_pacer_count INTEGER,
    shadow_pacer_count INTEGER,
    total_sessions_attended INTEGER,
    pacing_percentage NUMERIC,
    streak_weeks INTEGER,
    miles_paced NUMERIC,
    runners_helped INTEGER,
    pace_groups_covered INTEGER,
    last_paced_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH user_pacing AS (
        SELECT 
            pgp.role,
            COUNT(*) as count,
            COALESCE(SUM(s.total_distance), 0) as distance,
            MAX(s.session_date) as last_date
        FROM pace_group_pacers_rogues_7a9k2m pgp
        JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
        JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
        WHERE pgp.user_id = get_user_pacer_stats.user_id
        AND pgp.status = 'confirmed'
        AND s.session_date >= start_date
        AND s.status = 'completed'
        GROUP BY pgp.role
    ),
    user_attendance AS (
        SELECT COUNT(*) as total_sessions
        FROM session_attendees_rogues_7a9k2m sa
        JOIN sessions_rogues_7a9k2m s ON sa.session_id = s.id
        WHERE sa.user_id = get_user_pacer_stats.user_id
        AND s.session_date >= start_date
        AND s.status = 'completed'
    ),
    runners_impact AS (
        SELECT COUNT(DISTINCT sa.user_id) as helped_count
        FROM pace_group_pacers_rogues_7a9k2m pgp
        JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
        JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
        JOIN session_attendees_rogues_7a9k2m sa ON s.id = sa.session_id
        WHERE pgp.user_id = get_user_pacer_stats.user_id
        AND pgp.status = 'confirmed'
        AND s.session_date >= start_date
        AND s.status = 'completed'
        AND sa.user_id != get_user_pacer_stats.user_id
    ),
    pace_groups_impact AS (
        SELECT COUNT(DISTINCT pg.id) as groups_covered
        FROM pace_group_pacers_rogues_7a9k2m pgp
        JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
        JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
        WHERE pgp.user_id = get_user_pacer_stats.user_id
        AND pgp.status = 'confirmed'
        AND s.session_date >= start_date
        AND s.status = 'completed'
    )
    SELECT 
        COALESCE((SELECT count FROM user_pacing WHERE role = 'primary'), 0)::INTEGER,
        COALESCE((SELECT count FROM user_pacing WHERE role = 'shadow'), 0)::INTEGER,
        COALESCE(ua.total_sessions, 0)::INTEGER,
        CASE 
            WHEN COALESCE(ua.total_sessions, 0) > 0 THEN
                (COALESCE((SELECT SUM(count) FROM user_pacing), 0) * 100.0 / ua.total_sessions)
            ELSE 0
        END,
        3, -- Placeholder for streak calculation
        COALESCE((SELECT SUM(distance) FROM user_pacing), 0),
        COALESCE(ri.helped_count, 0)::INTEGER,
        COALESCE(pgi.groups_covered, 0)::INTEGER,
        (SELECT MAX(last_date) FROM user_pacing)
    FROM user_attendance ua
    FULL OUTER JOIN runners_impact ri ON true
    FULL OUTER JOIN pace_groups_impact pgi ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to get pacer coverage for upcoming sessions
CREATE OR REPLACE FUNCTION get_pacer_coverage(
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month'
) RETURNS TABLE (
    total_sessions INTEGER,
    covered_sessions INTEGER,
    coverage_percentage NUMERIC,
    fast_group_coverage NUMERIC,
    moderate_group_coverage NUMERIC,
    beginner_group_coverage NUMERIC,
    sessions_needing_pacers INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH upcoming_sessions AS (
        SELECT s.id as session_id, s.title
        FROM sessions_rogues_7a9k2m s
        WHERE s.session_date BETWEEN NOW() AND end_date
        AND s.status IN ('confirmed', 'pending')
    ),
    session_pace_groups AS (
        SELECT 
            pg.session_id,
            pg.id as group_id,
            pg.name,
            pg.required_pacers,
            COUNT(pgp.id) FILTER (WHERE pgp.status = 'confirmed') as confirmed_pacers,
            CASE 
                WHEN pg.min_pace <= 5.5 THEN 'fast'
                WHEN pg.min_pace <= 6.5 THEN 'moderate'
                ELSE 'beginner'
            END as pace_category
        FROM pace_groups_rogues_7a9k2m pg
        LEFT JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
        WHERE pg.session_id IN (SELECT session_id FROM upcoming_sessions)
        GROUP BY pg.session_id, pg.id, pg.name, pg.required_pacers, pg.min_pace
    ),
    coverage_stats AS (
        SELECT 
            COUNT(DISTINCT session_id) as total_sessions,
            COUNT(DISTINCT session_id) FILTER (
                WHERE session_id IN (
                    SELECT session_id 
                    FROM session_pace_groups 
                    WHERE confirmed_pacers >= required_pacers
                    GROUP BY session_id
                    HAVING COUNT(*) = (
                        SELECT COUNT(*) 
                        FROM session_pace_groups spg2 
                        WHERE spg2.session_id = session_pace_groups.session_id
                    )
                )
            ) as covered_sessions,
            
            -- Fast group coverage
            COUNT(DISTINCT session_id) FILTER (WHERE pace_category = 'fast' AND confirmed_pacers >= required_pacers) * 100.0 / 
            NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE pace_category = 'fast'), 0) as fast_coverage,
            
            -- Moderate group coverage  
            COUNT(DISTINCT session_id) FILTER (WHERE pace_category = 'moderate' AND confirmed_pacers >= required_pacers) * 100.0 / 
            NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE pace_category = 'moderate'), 0) as moderate_coverage,
            
            -- Beginner group coverage
            COUNT(DISTINCT session_id) FILTER (WHERE pace_category = 'beginner' AND confirmed_pacers >= required_pacers) * 100.0 / 
            NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE pace_category = 'beginner'), 0) as beginner_coverage,
            
            COUNT(DISTINCT session_id) FILTER (WHERE confirmed_pacers < required_pacers) as needing_pacers
        FROM session_pace_groups
    )
    SELECT 
        COALESCE(cs.total_sessions, 0)::INTEGER,
        COALESCE(cs.covered_sessions, 0)::INTEGER,
        CASE 
            WHEN COALESCE(cs.total_sessions, 0) > 0 THEN
                (COALESCE(cs.covered_sessions, 0) * 100.0 / cs.total_sessions)
            ELSE 0
        END,
        COALESCE(cs.fast_coverage, 0),
        COALESCE(cs.moderate_coverage, 0),
        COALESCE(cs.beginner_coverage, 0),
        COALESCE(cs.needing_pacers, 0)::INTEGER
    FROM coverage_stats cs;
END;
$$ LANGUAGE plpgsql;

-- Function to get pacer opportunities for a user
CREATE OR REPLACE FUNCTION get_pacer_opportunities(
    user_id UUID,
    limit_count INTEGER DEFAULT 5
) RETURNS TABLE (
    session_id UUID,
    session_title TEXT,
    session_date DATE,
    session_time TIME,
    group_id UUID,
    group_name TEXT,
    needed_pacers INTEGER,
    pace_range TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as session_id,
        s.title as session_title,
        s.session_date as session_date,
        s.session_time as session_time,
        pg.id as group_id,
        pg.name as group_name,
        (pg.required_pacers - COUNT(pgp.id) FILTER (WHERE pgp.status = 'confirmed'))::INTEGER as needed_pacers,
        (pg.min_pace::TEXT || ' - ' || pg.max_pace::TEXT || ' min/km') as pace_range
    FROM sessions_rogues_7a9k2m s
    JOIN pace_groups_rogues_7a9k2m pg ON s.id = pg.session_id
    LEFT JOIN pace_group_pacers_rogues_7a9k2m pgp ON pg.id = pgp.pace_group_id
    WHERE s.session_date >= CURRENT_DATE
    AND s.status IN ('confirmed', 'pending')
    AND pg.id NOT IN (
        SELECT pace_group_id 
        FROM pace_group_pacers_rogues_7a9k2m 
        WHERE user_id = get_pacer_opportunities.user_id
    )
    GROUP BY s.id, s.title, s.session_date, s.session_time, pg.id, pg.name, pg.required_pacers, pg.min_pace, pg.max_pace
    HAVING COUNT(pgp.id) FILTER (WHERE pgp.status = 'confirmed') < pg.required_pacers
    ORDER BY s.session_date, s.session_time
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get pacer achievements for a user
CREATE OR REPLACE FUNCTION get_pacer_achievements(
    user_id UUID
) RETURNS TABLE (
    achievement_type TEXT,
    title TEXT,
    description TEXT,
    earned_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER,
    target INTEGER,
    completed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH user_pacer_history AS (
        SELECT 
            COUNT(*) FILTER (WHERE pgp.role = 'primary') as primary_count,
            COUNT(*) FILTER (WHERE pgp.role = 'shadow') as shadow_count,
            COUNT(*) as total_count,
            COUNT(DISTINCT pg.session_id) as sessions_paced,
            MIN(s.session_date) as first_paced,
            MAX(s.session_date) as last_paced
        FROM pace_group_pacers_rogues_7a9k2m pgp
        JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
        JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
        WHERE pgp.user_id = get_pacer_achievements.user_id
        AND pgp.status = 'confirmed'
        AND s.status = 'completed'
    )
    SELECT * FROM (
        VALUES 
        ('starter', '🥉 First Steps', 'Pace your first session', 
         (SELECT first_paced FROM user_pacer_history), 
         LEAST((SELECT sessions_paced FROM user_pacer_history), 1)::INTEGER, 1, 
         (SELECT sessions_paced FROM user_pacer_history) >= 1),
         
        ('mentor', '🥈 Mentor', 'Shadow pace 2 sessions', 
         (SELECT last_paced FROM user_pacer_history WHERE (SELECT shadow_count FROM user_pacer_history) >= 2), 
         (SELECT shadow_count FROM user_pacer_history)::INTEGER, 2, 
         (SELECT shadow_count FROM user_pacer_history) >= 2),
         
        ('reliable', '🥇 Reliable Pacer', 'Pace 5 sessions', 
         (SELECT last_paced FROM user_pacer_history WHERE (SELECT sessions_paced FROM user_pacer_history) >= 5), 
         (SELECT sessions_paced FROM user_pacer_history)::INTEGER, 5, 
         (SELECT sessions_paced FROM user_pacer_history) >= 5),
         
        ('veteran', '🏆 Veteran Pacer', 'Pace 10 sessions', 
         (SELECT last_paced FROM user_pacer_history WHERE (SELECT sessions_paced FROM user_pacer_history) >= 10), 
         (SELECT sessions_paced FROM user_pacer_history)::INTEGER, 10, 
         (SELECT sessions_paced FROM user_pacer_history) >= 10)
    ) AS achievements(achievement_type, title, description, earned_date, progress, target, completed);
END;
$$ LANGUAGE plpgsql;

-- Function to get pacer recognition/shoutouts
CREATE OR REPLACE FUNCTION get_pacer_recognition(
    limit_count INTEGER DEFAULT 5
) RETURNS TABLE (
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    user_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_achievements AS (
        SELECT 
            u.name,
            COUNT(*) as recent_paces,
            MAX(s.session_date) as last_paced
        FROM pace_group_pacers_rogues_7a9k2m pgp
        JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
        JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
        JOIN users_rogues_7a9k2m u ON pgp.user_id = u.id
        WHERE pgp.status = 'confirmed'
        AND s.status = 'completed'
        AND s.session_date >= NOW() - INTERVAL '2 weeks'
        GROUP BY u.id, u.name
        HAVING COUNT(*) >= 2
        ORDER BY COUNT(*) DESC, MAX(s.session_date) DESC
        LIMIT limit_count
    )
    SELECT 
        ('🏅 Thanks to ' || ra.name || ' for pacing ' || ra.recent_paces || ' sessions recently!') as message,
        ra.last_paced as created_at,
        ra.name as user_name
    FROM recent_achievements ra;
END;
$$ LANGUAGE plpgsql;

-- Function to get pacer goals progress
CREATE OR REPLACE FUNCTION get_pacer_goals_progress(
    user_id UUID
) RETURNS TABLE (
    goal_type TEXT,
    title TEXT,
    description TEXT,
    progress INTEGER,
    target INTEGER,
    completed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE pgp.role = 'primary') as primary_count,
            COUNT(*) FILTER (WHERE pgp.role = 'shadow') as shadow_count,
            COUNT(*) as total_paces,
            COUNT(DISTINCT pg.session_id) as sessions_paced
        FROM pace_group_pacers_rogues_7a9k2m pgp
        JOIN pace_groups_rogues_7a9k2m pg ON pgp.pace_group_id = pg.id
        JOIN sessions_rogues_7a9k2m s ON pg.session_id = s.id
        WHERE pgp.user_id = get_pacer_goals_progress.user_id
        AND pgp.status = 'confirmed'
        AND s.status = 'completed'
        AND s.session_date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    attendance_stats AS (
        SELECT COUNT(*) as sessions_attended
        FROM session_attendees_rogues_7a9k2m sa
        JOIN sessions_rogues_7a9k2m s ON sa.session_id = s.id
        WHERE sa.user_id = get_pacer_goals_progress.user_id
        AND s.status = 'completed'
        AND s.session_date >= DATE_TRUNC('month', CURRENT_DATE)
    )
    SELECT * FROM (
        VALUES 
        ('starter', '🥉 Starter', 'Pace 1 session this month', 
         LEAST((SELECT sessions_paced FROM user_stats), 1)::INTEGER, 1, 
         (SELECT sessions_paced FROM user_stats) >= 1),
         
        ('mentor', '🥈 Mentor', 'Shadow pace 2 sessions this month', 
         (SELECT shadow_count FROM user_stats)::INTEGER, 2, 
         (SELECT shadow_count FROM user_stats) >= 2),
         
        ('balanced', '🥇 Balanced', 'Keep pacing under 30% of attendance', 
         CASE 
            WHEN (SELECT sessions_attended FROM attendance_stats) > 0 THEN
                LEAST(((SELECT sessions_paced FROM user_stats) * 100 / (SELECT sessions_attended FROM attendance_stats)), 30)::INTEGER
            ELSE 0
         END, 30, 
         CASE 
            WHEN (SELECT sessions_attended FROM attendance_stats) > 0 THEN
                ((SELECT sessions_paced FROM user_stats) * 100 / (SELECT sessions_attended FROM attendance_stats)) <= 30
            ELSE true
         END)
    ) AS goals(goal_type, title, description, progress, target, completed);
END;
$$ LANGUAGE plpgsql;

-- Add some test data for pacer analytics
DO $$
DECLARE
    admin_user UUID;
    member_user UUID;
    session_ids UUID[];
    group_ids UUID[];
BEGIN
    -- Get user IDs
    SELECT id INTO admin_user FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run';
    SELECT id INTO member_user FROM users_rogues_7a9k2m WHERE email = 'member@rogues.run';
    
    -- Get some completed session IDs
    SELECT ARRAY(
        SELECT id FROM sessions_rogues_7a9k2m 
        WHERE status = 'completed' 
        ORDER BY session_date DESC 
        LIMIT 3
    ) INTO session_ids;
    
    -- Add some historical pacer data for analytics
    IF array_length(session_ids, 1) > 0 THEN
        -- Add pace groups to completed sessions if they don't exist
        INSERT INTO pace_groups_rogues_7a9k2m (session_id, name, min_pace, max_pace, required_pacers, shadow_slots)
        SELECT 
            session_ids[1], 
            'Analytics Test Group', 
            5.5, 
            6.0, 
            1, 
            1
        WHERE NOT EXISTS (
            SELECT 1 FROM pace_groups_rogues_7a9k2m WHERE session_id = session_ids[1]
        );
        
        -- Get the group ID
        SELECT id INTO group_ids[1] FROM pace_groups_rogues_7a9k2m WHERE session_id = session_ids[1] LIMIT 1;
        
        -- Add pacer records for analytics
        INSERT INTO pace_group_pacers_rogues_7a9k2m (pace_group_id, user_id, role, status, volunteered_at, approved_at)
        VALUES 
        (group_ids[1], admin_user, 'primary', 'confirmed', NOW() - INTERVAL '1 week', NOW() - INTERVAL '6 days'),
        (group_ids[1], member_user, 'shadow', 'confirmed', NOW() - INTERVAL '1 week', NOW() - INTERVAL '6 days')
        ON CONFLICT (pace_group_id, user_id) DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Added test pacer analytics data';
END $$;