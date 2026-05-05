CREATE TABLE public.reading_plans_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id, day)
);

ALTER TABLE public.reading_plans_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own progress select" ON public.reading_plans_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own progress insert" ON public.reading_plans_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own progress delete" ON public.reading_plans_progress
FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_progress_user_plan ON public.reading_plans_progress (user_id, plan_id);