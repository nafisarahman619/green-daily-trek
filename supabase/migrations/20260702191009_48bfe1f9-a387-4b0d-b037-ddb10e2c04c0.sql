
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🌱',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by any authenticated user"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_emoji)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Forest Friend'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_emoji', '🌱')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRANSPORT LOGS
CREATE TABLE public.transport_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mode TEXT NOT NULL,
  distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  trips INTEGER NOT NULL DEFAULT 1,
  co2_kg NUMERIC(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transport_logs_user_date_idx ON public.transport_logs (user_id, log_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_logs TO authenticated;
GRANT ALL ON public.transport_logs TO service_role;
ALTER TABLE public.transport_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transport logs"
  ON public.transport_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Leaderboard aggregate readable by all authenticated users
CREATE POLICY "Authenticated users can read all transport aggregates"
  ON public.transport_logs FOR SELECT TO authenticated USING (true);

-- WILDLIFE UNLOCKS
CREATE TABLE public.wildlife_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, species)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wildlife_unlocks TO authenticated;
GRANT ALL ON public.wildlife_unlocks TO service_role;
ALTER TABLE public.wildlife_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own unlocks"
  ON public.wildlife_unlocks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can view all unlocks"
  ON public.wildlife_unlocks FOR SELECT TO authenticated USING (true);
