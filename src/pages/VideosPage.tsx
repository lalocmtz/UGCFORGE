import { motion } from 'framer-motion';
import { Video } from 'lucide-react';

export default function VideosPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Mis Videos</h1>
      <div className="glass-card p-12 text-center">
        <Video className="mx-auto text-muted-foreground mb-4" size={48} />
        <p className="text-muted-foreground">Tus videos generados aparecerán aquí.</p>
        <p className="text-sm text-muted-foreground mt-1">Crea tu primer video UGC para empezar.</p>
      </div>
    </motion.div>
  );
}
