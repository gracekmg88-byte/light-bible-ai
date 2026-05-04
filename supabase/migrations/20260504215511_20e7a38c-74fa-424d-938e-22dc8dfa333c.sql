
-- Favoris
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, chapter, verse)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites select" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own favorites insert" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own favorites delete" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Notes
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes select" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own notes insert" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notes update" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own notes delete" ON public.notes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX favorites_user_idx ON public.favorites(user_id);
CREATE INDEX notes_user_idx ON public.notes(user_id);
CREATE INDEX notes_loc_idx ON public.notes(user_id, book_id, chapter);
