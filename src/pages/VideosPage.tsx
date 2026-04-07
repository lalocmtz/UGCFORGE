import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Video, Film, ExternalLink, Download, Trash2, Clock, CheckCircle, XCircle, Loader2,
} from 'lucide-react';

interface UGCProject {
  id: string;
  product_name: string;
  pipeline_mode: string | null;
  video_style: string;
  hook_3s: string | null;
  status: string | null;
  opening_video_url: string | null;
  created_at: string | null;
  variant_style: string | null;
}

export default function VideosPage() {
  const [projects, setProjects] = useState<UGCProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('ugc_projects')
      .select('id, product_name, pipeline_mode, video_style, hook_3s, status, opening_video_url, created_at, variant_style')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { toast.error(error.message); }
    setProjects(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ugc_projects').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Proyecto eliminado');
  };

  const statusIcon = (status: string | null) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={16} />;
      case 'failed': return <XCircle className="text-destructive" size={16} />;
      case 'running': return <Loader2 className="text-primary animate-spin" size={16} />;
      default: return <Clock className="text-muted-foreground" size={16} />;
    }
  };

  const statusLabel = (status: string | null) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
      case 'running': return 'Generando...';
      default: return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Mis Videos</h1>

      {projects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Film className="mx-auto text-muted-foreground mb-4" size={48} />
          <p className="text-muted-foreground">No tienes videos generados aún.</p>
          <p className="text-sm text-muted-foreground mt-1">Crea tu primer video UGC para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden"
              >
                {/* Video preview */}
                <div className="aspect-[9/16] bg-muted relative">
                  {project.opening_video_url ? (
                    <video
                      controls
                      className="w-full h-full object-cover"
                      src={project.opening_video_url}
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Video className="text-muted-foreground" size={40} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                    {statusIcon(project.status)}
                    <span>{statusLabel(project.status)}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-heading font-semibold text-sm truncate">{project.product_name}</h3>
                  {project.hook_3s && (
                    <p className="text-xs text-primary italic truncate">"{project.hook_3s}"</p>
                  )}
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">{project.pipeline_mode || 'quick'}</span>
                    <span className="bg-muted px-2 py-0.5 rounded">{project.video_style}</span>
                    {project.variant_style && <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded">{project.variant_style}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {project.opening_video_url && (
                      <>
                        <a href={project.opening_video_url} target="_blank" rel="noopener">
                          <Button size="sm" variant="outline"><ExternalLink size={12} /></Button>
                        </a>
                        <a href={project.opening_video_url} download target="_blank" rel="noopener">
                          <Button size="sm" variant="outline"><Download size={12} /></Button>
                        </a>
                      </>
                    )}
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(project.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
