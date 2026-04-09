-- ============================================
-- Makej! Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ PROFILES ============
-- Extends Supabase auth.users with app-specific data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'employer')),
  rating NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  jobs_done INTEGER DEFAULT 0,
  hours_logged INTEGER DEFAULT 0,
  punctuality INTEGER DEFAULT 100,
  total_earned NUMERIC(10,2) DEFAULT 0,
  company_name TEXT, -- only for employers
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ JOBS ============
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  pay NUMERIC(10,2) NOT NULL,
  pay_unit TEXT DEFAULT '/ hod',
  tips BOOLEAN DEFAULT false,
  date TEXT NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT DEFAULT '',
  requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  image_url TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ MATCHES ============
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, job_id)
);

-- ============ MESSAGES ============
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ REJECTIONS (to skip already-seen jobs) ============
CREATE TABLE rejections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, job_id)
);

-- ============ INDEXES ============
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_matches_worker ON matches(worker_id);
CREATE INDEX idx_matches_job ON matches(job_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_rejections_worker ON rejections(worker_id);

-- ============ ROW LEVEL SECURITY ============

-- Profiles: users can read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Jobs: everyone can read active, employers can manage own
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active jobs visible to all" ON jobs FOR SELECT USING (status = 'active' OR employer_id = auth.uid());
CREATE POLICY "Employers can create jobs" ON jobs FOR INSERT WITH CHECK (employer_id = auth.uid());
CREATE POLICY "Employers can update own jobs" ON jobs FOR UPDATE USING (employer_id = auth.uid());
CREATE POLICY "Employers can delete own jobs" ON jobs FOR DELETE USING (employer_id = auth.uid());

-- Matches: users can see own matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers see own matches" ON matches FOR SELECT USING (worker_id = auth.uid());
CREATE POLICY "Workers can create matches" ON matches FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Match participants can update" ON matches FOR UPDATE USING (worker_id = auth.uid());

-- Messages: match participants can read/write
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match participants can read messages" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM matches WHERE matches.id = messages.match_id AND (matches.worker_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = matches.job_id AND jobs.employer_id = auth.uid()))));
CREATE POLICY "Match participants can send messages" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM matches WHERE matches.id = match_id AND (matches.worker_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = matches.job_id AND jobs.employer_id = auth.uid()))));

-- Rejections: workers manage own
ALTER TABLE rejections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers see own rejections" ON rejections FOR SELECT USING (worker_id = auth.uid());
CREATE POLICY "Workers can create rejections" ON rejections FOR INSERT WITH CHECK (worker_id = auth.uid());

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED DATA (sample jobs) ============
-- NOTE: These use a placeholder employer_id. After you register as an employer,
-- update these or create new jobs from the dashboard.
