-- ============================================================
-- REFLEXRHYTHM — SUPABASE COMPLETE SETUP & MIGRATION SCRIPT
-- Jalankan query ini di Supabase Dashboard -> SQL Editor
-- ============================================================

-- ── 1. TABEL PROFILES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT DEFAULT 'Guest',
  avatar_url TEXT DEFAULT 'default',
  xp BIGINT DEFAULT 0,
  banner_skin TEXT DEFAULT 'arcade-spark',
  stats JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT 'default';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- ── 2. TRIGGER AUTOMATIC PROFILE ON SIGNUP ─────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', 'default')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. TABEL BEST SCORES (REKOR SKOR TERBAIK PER LAGU & DIFFICULTY) ──
CREATE TABLE IF NOT EXISTS public.best_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT DEFAULT 'default',
  track_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  accuracy TEXT NOT NULL DEFAULT '0%',
  rank TEXT NOT NULL DEFAULT 'D',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_track_mode_diff UNIQUE (user_id, track_id, mode, difficulty)
);

ALTER TABLE public.best_scores ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Best scores are viewable by everyone') THEN
    CREATE POLICY "Best scores are viewable by everyone" ON public.best_scores FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert or update their best score') THEN
    CREATE POLICY "Users can insert or update their best score" ON public.best_scores FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 4. TABEL SCORES (RIWAYAT SELURUH SKOR DIMAINKAN) ────────────
CREATE TABLE IF NOT EXISTS public.scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  track_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_combo INTEGER DEFAULT 0,
  accuracy TEXT DEFAULT '0%',
  rank TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Scores are viewable by everyone') THEN
    CREATE POLICY "Scores are viewable by everyone" ON public.scores FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own score') THEN
    CREATE POLICY "Users can insert their own score" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. STORAGE BUCKET AVATARS ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Avatars') THEN
    CREATE POLICY "Public Access to Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Users Upload Avatars') THEN
    CREATE POLICY "Authenticated Users Upload Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users Update Own Avatars') THEN
    CREATE POLICY "Users Update Own Avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;
