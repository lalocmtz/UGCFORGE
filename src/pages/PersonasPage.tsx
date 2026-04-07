import { motion } from 'framer-motion';
import { PERSONA_LABELS, PERSONA_PROMPTS } from '@/lib/promptEngine';
import { Users } from 'lucide-react';

const personas = Object.entries(PERSONA_LABELS).map(([key, label]) => ({
  key,
  label,
  description: PERSONA_PROMPTS[key].slice(0, 80) + '...',
}));

export default function PersonasPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Personas IA</h1>
      <p className="text-muted-foreground">Biblioteca de influencers virtuales disponibles.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((p, i) => (
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
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
            <p className="text-xs text-muted-foreground mt-2">0 usos</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
