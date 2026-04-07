
CREATE TABLE public.video_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_url TEXT,
  raw_transcript TEXT,
  manual_script TEXT,
  product_name TEXT NOT NULL,
  product_category TEXT,
  target_platform TEXT DEFAULT 'tiktok_shop',
  compliance_filter BOOLEAN DEFAULT true,
  original_plays INTEGER,
  original_likes INTEGER,
  original_shares INTEGER,
  analysis_result JSONB,
  variants_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.video_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their analyses"
  ON public.video_analyses FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE public.generation_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_id UUID REFERENCES public.video_analyses(id),
  total_videos INTEGER NOT NULL,
  completed_videos INTEGER DEFAULT 0,
  failed_videos INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.generation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their batches"
  ON public.generation_batches FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE public.ugc_projects
  ADD COLUMN source_analysis_id UUID REFERENCES public.video_analyses(id),
  ADD COLUMN batch_id UUID REFERENCES public.generation_batches(id),
  ADD COLUMN variant_style TEXT,
  ADD COLUMN hook_3s TEXT;

ALTER TABLE public.user_settings
  ADD COLUMN anthropic_key TEXT,
  ADD COLUMN rapidapi_key TEXT,
  ADD COLUMN assemblyai_key TEXT;
