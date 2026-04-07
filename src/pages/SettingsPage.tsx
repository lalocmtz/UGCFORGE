import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, Loader2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function SettingsPage() {
  const [kieKey, setKieKey] = useState('');
  const [elevenKey, setElevenKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [rapidapiKey, setRapidapiKey] = useState('');
  const [assemblyaiKey, setAssemblyaiKey] = useState('');
  const [brandName, setBrandName] = useState('');
  const [kieStatus, setKieStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [kieCredits, setKieCredits] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_settings').select('*').eq('id', user.id).single();
    if (data) {
      setKieKey(data.kie_api_key || '');
      setElevenKey(data.elevenlabs_api_key || '');
      setAnthropicKey(data.anthropic_key || '');
      setRapidapiKey(data.rapidapi_key || '');
      setAssemblyaiKey(data.assemblyai_key || '');
      setBrandName(data.brand_name || '');
    }
  };

  const verifyKie = async () => {
    setVerifying(true);
    try {
      const res = await fetch('https://api.kie.ai/api/v1/chat/credit', {
        headers: { Authorization: `Bearer ${kieKey}` },
      });
      const json = await res.json();
      if (res.ok && json.data !== undefined) {
        setKieStatus('valid');
        setKieCredits(json.data);
      } else {
        setKieStatus('invalid');
      }
    } catch {
      setKieStatus('invalid');
    }
    setVerifying(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('No autenticado'); setSaving(false); return; }

    const { error } = await supabase.from('user_settings').upsert({
      id: user.id,
      kie_api_key: kieKey,
      elevenlabs_api_key: elevenKey,
      anthropic_key: anthropicKey,
      rapidapi_key: rapidapiKey,
      assemblyai_key: assemblyaiKey,
      brand_name: brandName,
    });

    if (error) toast.error(error.message);
    else toast.success('Settings guardados');
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>

      {/* kie.ai */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Shield className="text-primary" size={20} /></div>
          <h3 className="font-heading font-semibold">kie.ai</h3>
          {kieStatus === 'valid' && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={12} /> Válida — {kieCredits} créditos</span>}
          {kieStatus === 'invalid' && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1"><X size={12} /> Inválida</span>}
        </div>
        <div className="flex gap-2">
          <Input type="password" placeholder="KIE_AI_API_KEY" value={kieKey} onChange={(e) => setKieKey(e.target.value)} className="bg-muted border-border" />
          <Button variant="outline" onClick={verifyKie} disabled={!kieKey || verifying}>
            {verifying ? <Loader2 className="animate-spin" size={16} /> : 'Verificar'}
          </Button>
        </div>
      </div>

      {/* ElevenLabs */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10"><Shield className="text-secondary" size={20} /></div>
          <h3 className="font-heading font-semibold">ElevenLabs</h3>
        </div>
        <Input type="password" placeholder="ELEVENLABS_API_KEY" value={elevenKey} onChange={(e) => setElevenKey(e.target.value)} className="bg-muted border-border" />
        <p className="text-xs text-muted-foreground">Opcional. Necesario para voice cloning en Pipeline Modo B.</p>
      </div>

      {/* Video Intelligence APIs */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Brain className="text-primary" size={20} /></div>
          <h3 className="font-heading font-semibold">Video Intelligence APIs</h3>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Anthropic API Key (Claude)</label>
          <Input type="password" placeholder="sk-ant-..." value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className="bg-muted border-border" />
          <p className="text-xs text-muted-foreground">Necesario para analizar scripts y generar variantes.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">RapidAPI Key (TikTok Downloader)</label>
          <Input type="password" placeholder="Tu RapidAPI key" value={rapidapiKey} onChange={(e) => setRapidapiKey(e.target.value)} className="bg-muted border-border" />
          <p className="text-xs text-muted-foreground">Opcional. Para extraer videos de TikTok por URL. Obtén tu key en rapidapi.com</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">AssemblyAI API Key</label>
          <Input type="password" placeholder="Tu AssemblyAI key" value={assemblyaiKey} onChange={(e) => setAssemblyaiKey(e.target.value)} className="bg-muted border-border" />
          <p className="text-xs text-muted-foreground">Opcional. Para transcribir audio de videos. Tier gratuito en assemblyai.com</p>
        </div>
      </div>

      {/* Brand */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold">Marca</h3>
        <Input placeholder="Nombre de tu marca" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="bg-muted border-border" />
      </div>

      <Button onClick={saveSettings} disabled={saving} className="gradient-accent w-full" size="lg">
        {saving ? 'Guardando...' : 'Guardar Settings'}
      </Button>
    </motion.div>
  );
}
