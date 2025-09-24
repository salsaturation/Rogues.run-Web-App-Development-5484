-- Drop the existing table if it exists to recreate with proper foreign key
DROP TABLE IF EXISTS template_usage_rogues_7a9k2m CASCADE;
DROP TABLE IF EXISTS session_templates_rogues_7a9k2m CASCADE;

-- Create Session Templates Table with proper foreign key
CREATE TABLE IF NOT EXISTS session_templates_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  -- Session Template Data
  template_data JSONB NOT NULL,
  -- Metadata
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Tags for organization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create Template Usage Tracking Table
CREATE TABLE IF NOT EXISTS template_usage_rogues_7a9k2m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES session_templates_rogues_7a9k2m(id) ON DELETE CASCADE,
  used_by UUID NOT NULL REFERENCES users_rogues_7a9k2m(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions_rogues_7a9k2m(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE session_templates_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_rogues_7a9k2m ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (simplified for now)
CREATE POLICY "Enable public read access" ON session_templates_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON session_templates_rogues_7a9k2m FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for template owners" ON session_templates_rogues_7a9k2m FOR UPDATE USING (true);
CREATE POLICY "Enable delete for template owners" ON session_templates_rogues_7a9k2m FOR DELETE USING (true);

CREATE POLICY "Enable public read access" ON template_usage_rogues_7a9k2m FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON template_usage_rogues_7a9k2m FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_session_templates_created_by ON session_templates_rogues_7a9k2m(created_by);
CREATE INDEX idx_session_templates_public ON session_templates_rogues_7a9k2m(is_public);
CREATE INDEX idx_session_templates_tags ON session_templates_rogues_7a9k2m USING gin(tags);
CREATE INDEX idx_template_usage_template_id ON template_usage_rogues_7a9k2m(template_id);

-- Insert some default templates with proper user reference
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM users_rogues_7a9k2m WHERE email = 'admin@rogues.run' LIMIT 1;
    
    -- Only insert if we found the admin user
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO session_templates_rogues_7a9k2m (
            name,
            description,
            is_public,
            created_by,
            template_data,
            tags
        ) VALUES 
        (
            'Morning Easy Run',
            'Standard morning easy run template with multiple pace groups',
            TRUE,
            admin_user_id,
            '{"title": "Morning Easy Run","description": "Join us for a refreshing morning easy run. Perfect for building base fitness and connecting with fellow runners.","time": "07:00","endTime": "08:00","maxAttendees": 25,"routeType": "flexible","totalDistance": 5,"runType": "easy","paceMin": 5.5,"paceMax": 7.5,"difficulty": "beginner","waitlistEnabled": true,"specialInstructions": "Please arrive 10 minutes early for a group warm-up. Bring water and wear appropriate running gear.","requiredGear": ["Running shoes","Water bottle"],"paceGroups": [{"name": "Fast Group (5:30-6:00)","minPace": 5.5,"maxPace": 6.0,"description": "For experienced runners looking for a faster easy pace","requiredPacers": 1,"shadowSlots": 1},{"name": "Medium Group (6:00-6:30)","minPace": 6.0,"maxPace": 6.5,"description": "Most popular pace group for regular runners","requiredPacers": 2,"shadowSlots": 1},{"name": "Comfortable Group (6:30-7:00)","minPace": 6.5,"maxPace": 7.0,"description": "Comfortable conversational pace","requiredPacers": 1,"shadowSlots": 2},{"name": "Beginner Group (7:00-7:30)","minPace": 7.0,"maxPace": 7.5,"description": "Perfect for beginners and those returning to running","requiredPacers": 1,"shadowSlots": 1}]}',
            ARRAY['morning','easy','beginner-friendly']
        ),
        (
            'Hill Training Session',
            'Structured hill training with pace groups for different abilities',
            TRUE,
            admin_user_id,
            '{"title": "Hill Training Session","description": "Challenging hill repeats to build strength and speed. We will work on both short steep hills and longer gradual climbs.","time": "18:30","endTime": "19:45","maxAttendees": 20,"routeType": "structured","totalDistance": 8,"runType": "interval","paceMin": 4.5,"paceMax": 6.5,"difficulty": "intermediate","waitlistEnabled": true,"specialInstructions": "This is a challenging workout. Please ensure you have done hill training before. We will have different groups based on ability.","requiredGear": ["Running shoes with good grip","Water bottle","Towel"],"paceGroups": [{"name": "Advanced Hills (4:30-5:30)","minPace": 4.5,"maxPace": 5.5,"description": "For experienced runners, fast hill repeats","requiredPacers": 1,"shadowSlots": 0},{"name": "Intermediate Hills (5:30-6:00)","minPace": 5.5,"maxPace": 6.0,"description": "Moderate pace hill training","requiredPacers": 2,"shadowSlots": 1},{"name": "Beginner Hills (6:00-6:30)","minPace": 6.0,"maxPace": 6.5,"description": "Introduction to hill training","requiredPacers": 1,"shadowSlots": 1}]}',
            ARRAY['evening','hills','interval','strength']
        ),
        (
            'Long Run Weekend',
            'Extended distance run for endurance building',
            TRUE,
            admin_user_id,
            '{"title": "Weekend Long Run","description": "Build your endurance with our weekly long run. Multiple distance options available to suit different training goals.","time": "08:00","endTime": "10:30","maxAttendees": 30,"routeType": "predefined","totalDistance": 15,"runType": "long-slow","paceMin": 6.0,"paceMax": 8.0,"difficulty": "intermediate","waitlistEnabled": true,"specialInstructions": "Multiple distance options: 10km, 15km, 20km. Water stations every 5km. Start with a gentle warm-up.","requiredGear": ["Running shoes","Water bottle","Energy gels/snacks","Phone for emergencies"],"paceGroups": [{"name": "Fast Long (6:00-6:30)","minPace": 6.0,"maxPace": 6.5,"description": "Faster long run pace for experienced runners","requiredPacers": 1,"shadowSlots": 1},{"name": "Steady Long (6:30-7:00)","minPace": 6.5,"maxPace": 7.0,"description": "Steady sustainable pace","requiredPacers": 2,"shadowSlots": 1},{"name": "Comfortable Long (7:00-7:30)","minPace": 7.0,"maxPace": 7.5,"description": "Comfortable conversational long run","requiredPacers": 2,"shadowSlots": 2},{"name": "Easy Long (7:30-8:00)","minPace": 7.5,"maxPace": 8.0,"description": "Easy long run for building endurance","requiredPacers": 1,"shadowSlots": 1}]}',
            ARRAY['weekend','long-run','endurance','multi-distance']
        );
    END IF;
END $$;