-- Create Club Settings Table
CREATE TABLE IF NOT EXISTS club_settings_rogues_7a9k2m (
    id INTEGER PRIMARY KEY DEFAULT 1,
    club_name TEXT NOT NULL DEFAULT 'Running Club',
    club_tagline TEXT DEFAULT 'Join the Running Revolution',
    club_motto TEXT DEFAULT 'Every step counts, every mile matters',
    club_logo TEXT DEFAULT '',
    club_favicon TEXT DEFAULT '',
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#8b5cf6',
    description TEXT DEFAULT 'A community of passionate runners pushing boundaries together.',
    website TEXT DEFAULT '',
    social_media JSONB DEFAULT '{"facebook": "", "instagram": "", "twitter": "", "strava": ""}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_club_settings_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE club_settings_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable public read access" ON club_settings_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable insert for admin users" ON club_settings_rogues_7a9k2m FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users_rogues_7a9k2m
        WHERE id = auth.uid() AND is_admin = true
    )
);
CREATE POLICY "Enable update for admin users" ON club_settings_rogues_7a9k2m FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users_rogues_7a9k2m
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Insert default club settings
INSERT INTO club_settings_rogues_7a9k2m (
    club_name,
    club_tagline,
    club_motto,
    description
) VALUES (
    'Rogues.run',
    'Join the Running Revolution',
    'Every step counts, every mile matters',
    'A community of passionate runners pushing boundaries together.'
) ON CONFLICT (id) DO NOTHING;