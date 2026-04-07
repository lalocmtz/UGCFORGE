import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserSettings {
  kie_api_key: string;
  elevenlabs_api_key: string;
  anthropic_key: string;
  rapidapi_key: string;
  assemblyai_key: string;
  brand_name: string;
  default_persona: string;
  default_cta: string;
}

const DEFAULTS: UserSettings = {
  kie_api_key: '',
  elevenlabs_api_key: '',
  anthropic_key: '',
  rapidapi_key: '',
  assemblyai_key: '',
  brand_name: '',
  default_persona: 'latam_woman_25_35',
  default_cta: 'Agregalo al carrito naranja',
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading settings:', error);
    }

    setSettings(data ? { ...DEFAULTS, ...data } : DEFAULTS);
    setLoading(false);
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_settings')
      .upsert({ id: user.id, ...updates }, { onConflict: 'id' });

    if (error) throw error;

    setSettings(prev => prev ? { ...prev, ...updates } : { ...DEFAULTS, ...updates });
  };

  return { settings, loading, updateSettings, reload: loadSettings };
}
