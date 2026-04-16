
CREATE TABLE public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB
);

CREATE TABLE public.diaries (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  data JSONB
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public access projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public access diaries" ON public.diaries FOR ALL USING (true) WITH CHECK (true);
