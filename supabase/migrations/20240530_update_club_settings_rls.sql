-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable public read access" ON club_settings_rogues_7a9k2m;
DROP POLICY IF EXISTS "Enable insert for admin users" ON club_settings_rogues_7a9k2m;
DROP POLICY IF EXISTS "Enable update for admin users" ON club_settings_rogues_7a9k2m;

-- Create new RLS policies
-- Allow public read access to everyone
CREATE POLICY "Enable public read access" ON club_settings_rogues_7a9k2m
  FOR SELECT USING (true);

-- Allow insert for admin users
CREATE POLICY "Enable insert for admin users" ON club_settings_rogues_7a9k2m
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_rogues_7a9k2m 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow update for admin users
CREATE POLICY "Enable update for admin users" ON club_settings_rogues_7a9k2m
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_rogues_7a9k2m 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow upsert operations
CREATE POLICY "Enable upsert for admin users" ON club_settings_rogues_7a9k2m
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_rogues_7a9k2m 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert default settings if not exists
INSERT INTO club_settings_rogues_7a9k2m (
  id,
  club_name,
  club_tagline,
  club_motto,
  description,
  distance_unit
) VALUES (
  1,
  'Rogues.run',
  'Join the Running Revolution',
  'Every step counts, every mile matters',
  'A community of passionate runners pushing boundaries together.',
  'km'
) ON CONFLICT (id) DO NOTHING;