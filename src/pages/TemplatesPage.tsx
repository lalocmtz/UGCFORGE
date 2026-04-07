import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUGCStore } from '@/store/ugcStore';
import { Button } from '@/components/ui/button';

const templates = [
  {
    name: 'Feel Ink',
    category: 'Tattoo',
    gradient: 'from-orange-500/20 to-red-500/20',
    desc: 'Tatuajes temporales hiperrealistas',
    prefill: {
      productName: 'Feel Ink',
      keyBenefit: 'los tatuajes temporales se ven increíblemente reales, duran días y son completamente seguros para tu piel',
      cta: 'Agrégalo al carrito naranja',
      productDescription: 'tatuajes temporales hiperrealistas que duran hasta 2 semanas',
    },
  },
  {
    name: 'Skinglow',
    category: 'Beauty',
    gradient: 'from-purple-500/20 to-pink-500/20',
    desc: 'Suplementos de skincare',
    prefill: {
      productName: 'Skinglow',
      keyBenefit: 'mi piel se ve más luminosa, uniforme y joven — y se nota desde la primera semana',
      cta: 'Agrégalo al carrito naranja',
    },
  },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { prefill } = useUGCStore();

  const handleUse = (template: typeof templates[0]) => {
    prefill(template.prefill);
    navigate('/new');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Templates</h1>
      <p className="text-muted-foreground">Templates pre-configurados para empezar rápido.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {templates.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-6 bg-gradient-to-br ${t.gradient}`}
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.category}</span>
            <h3 className="text-xl font-heading font-bold mt-2">{t.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
            <Button onClick={() => handleUse(t)} className="mt-4 gradient-accent" size="sm">
              Usar template
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
