-- Add distance_unit column to club_settings table
ALTER TABLE club_settings_rogues_7a9k2m 
ADD COLUMN IF NOT EXISTS distance_unit TEXT DEFAULT 'km';

-- Update existing records to use default unit
UPDATE club_settings_rogues_7a9k2m
SET distance_unit = 'km'
WHERE distance_unit IS NULL;