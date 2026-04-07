-- ============================================
-- ORBITPOST DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ── Profiles (extends auth.users) ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  onboarded BOOLEAN DEFAULT false,
  notification_approvals BOOLEAN DEFAULT true,
  notification_status BOOLEAN DEFAULT true,
  notification_trends BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Campaigns ──
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trend', 'product')),
  input_text TEXT,
  url TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Schedules ──
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  times_per_day INTEGER NOT NULL CHECK (times_per_day BETWEEN 1 AND 10),
  time_slots TIME[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Posts ──
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated','pending_review','approved','scheduled','posted','failed','skipped')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  error_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_status ON public.posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON public.posts(scheduled_at) WHERE status IN ('approved','scheduled');

-- ── Connected Accounts ──
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  composio_account_id TEXT NOT NULL,
  account_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, composio_account_id)
);

-- ── Notifications ──
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
CREATE POLICY "Users can view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
CREATE POLICY "Users can create campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;
CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

-- Schedules
DROP POLICY IF EXISTS "Users can view own schedules" ON public.schedules;
CREATE POLICY "Users can view own schedules" ON public.schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = schedules.campaign_id AND campaigns.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create schedules" ON public.schedules;
CREATE POLICY "Users can create schedules" ON public.schedules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = schedules.campaign_id AND campaigns.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own schedules" ON public.schedules;
CREATE POLICY "Users can update own schedules" ON public.schedules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = schedules.campaign_id AND campaigns.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own schedules" ON public.schedules;
CREATE POLICY "Users can delete own schedules" ON public.schedules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = schedules.campaign_id AND campaigns.user_id = auth.uid())
  );

-- Posts
DROP POLICY IF EXISTS "Users can view own posts" ON public.posts;
CREATE POLICY "Users can view own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Connected Accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON public.connected_accounts;
CREATE POLICY "Users can view own accounts" ON public.connected_accounts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create accounts" ON public.connected_accounts;
CREATE POLICY "Users can create accounts" ON public.connected_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON public.connected_accounts;
CREATE POLICY "Users can update own accounts" ON public.connected_accounts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own accounts" ON public.connected_accounts;
CREATE POLICY "Users can delete own accounts" ON public.connected_accounts FOR DELETE USING (auth.uid() = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

