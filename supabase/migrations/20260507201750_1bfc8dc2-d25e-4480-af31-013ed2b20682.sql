
-- Agenda entries (journal personnel)
CREATE TABLE public.agenda_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  mood text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agenda_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own agenda select" ON public.agenda_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own agenda insert" ON public.agenda_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own agenda update" ON public.agenda_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own agenda delete" ON public.agenda_entries FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_agenda_updated
BEFORE UPDATE ON public.agenda_entries
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Custom instrumentals uploaded by admin
CREATE TABLE public.custom_instrumentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  mood text NOT NULL DEFAULT '',
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_instrumentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read instrumentals" ON public.custom_instrumentals FOR SELECT USING (true);
CREATE POLICY "admin insert instrumentals" ON public.custom_instrumentals FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete instrumentals" ON public.custom_instrumentals FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket public for instrumentals
INSERT INTO storage.buckets (id, name, public) VALUES ('instrumentals', 'instrumentals', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read instrumentals bucket" ON storage.objects FOR SELECT USING (bucket_id = 'instrumentals');
CREATE POLICY "admin upload instrumentals bucket" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'instrumentals' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete instrumentals bucket" ON storage.objects FOR DELETE
  USING (bucket_id = 'instrumentals' AND public.has_role(auth.uid(), 'admin'));
