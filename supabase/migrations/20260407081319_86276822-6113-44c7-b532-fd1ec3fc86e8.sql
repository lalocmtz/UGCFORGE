CREATE TABLE public.ugc_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT NOT NULL,
  persona_type TEXT NOT NULL,
  video_style TEXT NOT NULL,
  hook_type TEXT NOT NULL,
  key_benefit TEXT NOT NULL,
  cta TEXT NOT NULL DEFAULT 'Agregalo al carrito naranja',
  script TEXT,
  pipeline_mode TEXT DEFAULT 'quick',
  status TEXT DEFAULT 'pending',
  current_step TEXT,
  steps_data JSONB DEFAULT '[]',
  opening_video_url TEXT,
  scene_clips JSONB DEFAULT '[]',
  persona_image_url TEXT,
  voiceover_urls JSONB DEFAULT '[]',
  cloned_voice_id TEXT,
  credits_used INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  persona_type TEXT NOT NULL,
  base_image_url TEXT NOT NULL,
  character_sheet JSONB,
  el_voice_id TEXT,
  el_voice_name TEXT,
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  kie_api_key TEXT,
  elevenlabs_api_key TEXT,
  default_persona TEXT DEFAULT 'latam_woman_25_35',
  default_cta TEXT DEFAULT 'Agregalo al carrito naranja',
  brand_name TEXT,
  credits_cached INTEGER DEFAULT 0,
  credits_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ugc_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their projects" ON public.ugc_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their personas" ON public.personas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their settings" ON public.user_settings FOR ALL USING (auth.uid() = id);

INSERT INTO storage.buckets (id, name, public) VALUES ('voiceovers', 'voiceovers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Public read voiceovers" ON storage.objects FOR SELECT USING (bucket_id = 'voiceovers');
CREATE POLICY "Users upload voiceovers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voiceovers' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Users upload product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ugc_projects_updated_at
  BEFORE UPDATE ON public.ugc_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();