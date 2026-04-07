import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function SettingsPage() {
  const [kieKey, setKieKey] = useState('');
  const [elevenKey, setElevenKey] = useState('');
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
    const { data } = await supabase.from('user_settings' as any).select('*').eq('id', user.id).single();
    if (data) {
      const s = data as any;
      setKieKey(s.kie_api_key || '');
      setElevenKey(s.elevenlabs_api_key || '');
      setBrandName(s.brand_name || '');
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

    const { error } = await supabase.from('user_settings' as any).upsert({
      id: user.id,
      kie_api_key: kieKey,
      elevenlabs_api_key: elevenKey,
      brand_name: brandName,
    } as any);

    if (error) toast.error(error.message);
    else toast.success('Settings guardados');
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>

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

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10"><Shield className="text-secondary" size={20} /></div>
          <h3 className="font-heading font-semibold">ElevenLabs</h3>
        </div>
        <Input type="password" placeholder="ELEVENLABS_API_KEY" value={elevenKey} onChange={(e) => setElevenKey(e.target.value)} className="bg-muted border-border" />
        <p className="text-xs text-muted-foreground">Opcional. Necesario para voice cloning en Pipeline Modo B.</p>
      </div>

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
