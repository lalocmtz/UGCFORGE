import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONA_LABELS, PERSONA_PROMPTS } from '@/lib/promptEngine';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users, Star, Trash2, Loader2, Sparkles,
} from 'lucide-react';

const predefinedPersonas = Object.entries(PERSONA_LABELS).map(([key, label]) => ({
  key,
  label,
  description: PERSONA_PROMPTS[key]?.slice(0, 100) + '...',
}));

interface SavedPersona {
  id: string;
  name: string;
  persona_type: string;
  base_image_url: string;
  is_default: boolean | null;
  usage_count: number | null;
  created_at: string | null;
}

export default function PersonasPage() {
  const [savedPersonas, setSavedPersonas] = useState<SavedPersona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('personas')
      .select('id, name, persona_type, base_image_url, is_default, usage_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) toast.error(error.message);
    setSavedPersonas(data || []);
    setLoading(false);
  };

  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clear all defaults first
    await supabase.from('personas').update({ is_default: false }).eq('user_id', user.id);
    // Set new default
    const { error } = await supabase.from('personas').update({ is_default: true }).eq('id', id);
    if (error) { toast.error(error.message); return; }

    setSavedPersonas(prev => prev.map(p => ({ ...p, is_default: p.id === id })));
    toast.success('Persona por defecto actualizada');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('personas').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setSavedPersonas(prev => prev.filter(p => p.id !== id));
    toast.success('Persona eliminada');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold">Personas IA</h1>
        <p className="text-muted-foreground text-sm mt-1">Biblioteca de influencers virtuales</p>
      </div>

      {/* Predefined personas */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> Tipos Predefinidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedPersonas.map((p, i) => (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center mb-3">
                <Users className="text-primary-foreground" size={20} />
              </div>
              <h3 className="font-heading font-semibold">{p.label}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{p.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Saved personas */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
          <Users size={18} className="text-secondary" /> Mis Personas
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : savedPersonas.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Users className="mx-auto text-muted-foreground mb-3" size={40} />
            <p className="text-muted-foreground">No tienes personas personalizadas aún.</p>
            <p className="text-xs text-muted-foreground mt-1">Las personas personalizadas se crean automáticamente al usar el Pipeline Modo Full con voice cloning.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {savedPersonas.map((persona, i) => (
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={persona.base_image_url}
                      alt={persona.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-semibold truncate">{persona.name}</h3>
                        {persona.is_default && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Star size={10} /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{persona.persona_type}</p>
                      <p className="text-xs text-muted-foreground mt-1">{persona.usage_count || 0} usos</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!persona.is_default && (
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleSetDefault(persona.id)}>
                        <Star size={12} className="mr-1" /> Usar como default
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(persona.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
