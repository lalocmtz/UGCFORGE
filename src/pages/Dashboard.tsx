import { motion } from 'framer-motion';
import { Plus, Video, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const stats = [
  { label: 'Videos generados', value: '0', icon: Video },
  { label: 'Personas IA', value: '5', icon: Users },
  { label: 'Créditos', value: '—', icon: Zap },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Bienvenido a UGCForge</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <s.icon className="text-primary" size={22} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="glass-card p-8 text-center">
        <h2 className="text-xl font-heading font-semibold mb-2">Crea tu primer video UGC</h2>
        <p className="text-muted-foreground mb-6">
          Sube la foto de un producto, elige un influencer virtual y genera un video hiperrealista con IA.
        </p>
        <Link to="/new">
          <Button size="lg" className="gradient-accent text-lg px-8">
            <Plus size={20} className="mr-2" />
            Nuevo Video UGC
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <h3 className="text-lg font-heading font-semibold mb-4">Generaciones recientes</h3>
        <div className="glass-card p-6 text-center text-muted-foreground">
          Aún no tienes generaciones. ¡Crea tu primer video!
        </div>
      </motion.div>
    </motion.div>
  );
}
