
-- User settings (reminder time, notifications)
CREATE TABLE public.user_settings (
  user_id UUID NOT NULL PRIMARY KEY,
  reminder_time TEXT NOT NULL DEFAULT '08:00',
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  active_plan_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings select" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Reading sessions: track time + completion % per chapter
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id INTEGER NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completion_percent INTEGER NOT NULL DEFAULT 0,
  plan_id TEXT,
  plan_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions select" ON public.reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sessions insert" ON public.reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sessions update" ON public.reading_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_reading_sessions_user_created ON public.reading_sessions(user_id, created_at DESC);
