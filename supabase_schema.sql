-- ============================================================
-- SENTINEL AI - SUPABASE DATABASE SCHEMA
-- ============================================================
-- Run this in the Supabase SQL Editor to set up all tables,
-- Row Level Security policies, indexes, and triggers.
-- ============================================================

-- ============================================================
-- 0. CLEANUP (Removes old tables to prevent conflicts)
-- ============================================================
DROP TABLE IF EXISTS assignments, volunteers, hospital_capacity, reports, resources, notifications CASCADE;
DROP TABLE IF EXISTS incidents, hospitals, shelters, profiles, users CASCADE;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Citizen',
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'volunteer', 'hospital', 'authority', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id OR auth_id IS NULL);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Admins and authorities can update any profile
CREATE POLICY "Admins can update any profile" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin', 'authority'))
  );

-- ============================================================
-- 1.5. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  organization TEXT,
  badges TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile data" ON profiles
  FOR ALL USING (id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- 2. INCIDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('fire', 'flood', 'cyclone', 'earthquake', 'medical', 'road_accident', 'building_collapse', 'hurricane', 'other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'dispatching', 'active', 'resolved')),
  location JSONB NOT NULL DEFAULT '{}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  reported_by TEXT,
  reporter_id UUID REFERENCES users(id),
  image_url TEXT,
  voice_url TEXT,
  attachments TEXT[],
  ai_analysis JSONB,
  ai_summary TEXT,
  recommended_hospital TEXT,
  recommended_shelter TEXT,
  recommended_resources TEXT[],
  evacuation_advice TEXT,
  priority TEXT,
  confidence_score DOUBLE PRECISION,
  emergency_instructions TEXT,
  hospital_recommendation TEXT,
  shelter_recommendation TEXT,
  food_availability TEXT,
  medical_availability TEXT,
  safe_route TEXT,
  estimated_victims INTEGER,
  estimated_rescue_time TEXT,
  nearest_food_camp TEXT,
  nearest_water_source TEXT,
  is_offline BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(type);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_id ON incidents(reporter_id);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Anyone can read incidents
CREATE POLICY "Anyone can read incidents" ON incidents
  FOR SELECT USING (true);

-- Authenticated users can create incidents
CREATE POLICY "Authenticated users can create incidents" ON incidents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Reporter, volunteers, authorities, admins can update
CREATE POLICY "Authorized users can update incidents" ON incidents
  FOR UPDATE USING (
    reporter_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('volunteer', 'authority', 'admin'))
  );

-- Only authorities and admins can delete incidents
CREATE POLICY "Authorities can delete incidents" ON incidents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('authority', 'admin'))
  );

-- ============================================================
-- 3. VOLUNTEERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'medical', 'logistics')),
  location JSONB,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('active', 'available', 'busy', 'offline')),
  skills TEXT[],
  current_incident_id UUID REFERENCES incidents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_user_id ON volunteers(user_id);

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read volunteers" ON volunteers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create volunteers" ON volunteers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Volunteers can update own record" ON volunteers
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('authority', 'admin'))
  );

-- ============================================================
-- 4. ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  proof_url TEXT,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_incident ON assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer ON assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read assignments" ON assignments
  FOR SELECT USING (true);

CREATE POLICY "Authorities can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('authority', 'admin'))
    OR EXISTS (SELECT 1 FROM volunteers v JOIN users u ON v.user_id = u.id WHERE u.auth_id = auth.uid())
  );

CREATE POLICY "Assigned volunteer or authority can update" ON assignments
  FOR UPDATE USING (
    volunteer_id IN (SELECT v.id FROM volunteers v JOIN users u ON v.user_id = u.id WHERE u.auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('authority', 'admin'))
  );

-- ============================================================
-- 5. REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'sitrep' CHECK (category IN ('sitrep', 'briefing', 'alert')),
  incident_id UUID REFERENCES incidents(id),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reports" ON reports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authorities can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('authority', 'admin'))
  );

-- ============================================================
-- 6. RESOURCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'deployed', 'maintenance')),
  location JSONB,
  assigned_incident_id UUID REFERENCES incidents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read resources" ON resources
  FOR SELECT USING (true);

CREATE POLICY "Authorities can manage resources" ON resources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('authority', 'admin'))
  );

-- Allow authenticated users to insert resources
CREATE POLICY "Authenticated users can create resources" ON resources
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  user_id UUID REFERENCES users(id),
  incident_id UUID REFERENCES incidents(id),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id IS NULL OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Authenticated users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- 8. SHELTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shelters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location JSONB NOT NULL DEFAULT '{}',
  capacity INTEGER NOT NULL DEFAULT 0,
  occupied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed')),
  phone TEXT,
  amenities TEXT[],
  food_available BOOLEAN DEFAULT TRUE,
  drinking_water BOOLEAN DEFAULT TRUE,
  medical_assistance BOOLEAN DEFAULT FALSE,
  washrooms BOOLEAN DEFAULT TRUE,
  generator_status TEXT DEFAULT 'None',
  distance DOUBLE PRECISION,
  travel_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shelters" ON shelters
  FOR SELECT USING (true);

CREATE POLICY "Authorities can manage shelters" ON shelters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('authority', 'admin'))
  );

CREATE POLICY "Authenticated users can insert shelters" ON shelters
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 9. HOSPITALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location JSONB NOT NULL DEFAULT '{}',
  beds_total INTEGER NOT NULL DEFAULT 0,
  beds_occupied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'busy', 'critical')),
  phone TEXT,
  specialties TEXT[],
  distance DOUBLE PRECISION,
  travel_time TEXT,
  open_status TEXT DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hospitals" ON hospitals
  FOR SELECT USING (true);

CREATE POLICY "Authorities can manage hospitals" ON hospitals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('authority', 'admin'))
  );

CREATE POLICY "Authenticated users can insert hospitals" ON hospitals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 9.5. HOSPITAL_CAPACITY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_capacity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  beds_total INTEGER NOT NULL DEFAULT 0,
  beds_occupied INTEGER NOT NULL DEFAULT 0,
  icu_beds_total INTEGER DEFAULT 0,
  icu_beds_occupied INTEGER DEFAULT 0,
  oxygen_available BOOLEAN DEFAULT TRUE,
  doctors_available INTEGER DEFAULT 0,
  ambulances_available INTEGER DEFAULT 0,
  blood_availability TEXT DEFAULT 'Medium',
  reported_by UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hospital_capacity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hospital_capacity" ON hospital_capacity
  FOR SELECT USING (true);

CREATE POLICY "Hospital roles and authorities can manage capacity" ON hospital_capacity
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('hospital', 'authority', 'admin'))
  );

-- ============================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shelters_updated_at BEFORE UPDATE ON shelters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ENABLE REALTIME for key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE volunteers;
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE shelters;
ALTER PUBLICATION supabase_realtime ADD TABLE hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE hospital_capacity;
ALTER PUBLICATION supabase_realtime ADD TABLE resources;

-- ============================================================
-- SUPABASE STORAGE BUCKETS (run via Supabase Dashboard or API)
-- ============================================================
-- Create a storage bucket named 'incident-media' for images and voice recordings
-- INSERT INTO storage.buckets (id, name, public) VALUES ('incident-media', 'incident-media', true);

-- Storage policies (create via Dashboard):
-- Allow authenticated users to upload to incident-media
-- Allow public read access to incident-media
