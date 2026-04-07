import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIntelligenceStore } from '@/store/intelligenceStore';
import { KieAIClient } from '@/lib/kieai';
import { buildSeedancePrompt } from '@/lib/promptEngine';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowLeft, Play, CheckCircle, Loader2, Clock, AlertTriangle, ExternalLink, Download,
} from 'lucide-react';

export default function IntelligenceQueuePage() {
  const navigate = useNavigate();
  const store = useIntelligenceStore();
  const { batchItems, isBatchRunning, analysis } = store;

  const completedCount = batchItems.filter((b) => b.status === 'completed').length;
  const progress = batchItems.length ? Math.round((completedCount / batchItems.length) * 100) : 0;

  const startBatch = async () => {
    if (!analysis) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('No autenticado'); return; }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('kie_api_key')
      .eq('id', user.id)
      .single();

    if (!settings?.kie_api_key) {
      toast.error('Configura tu API key de kie.ai en Settings');
      return;
    }

    const client = new KieAIClient(settings.kie_api_key);
    store.setIsBatchRunning(true);

    for (const item of batchItems) {
      const variant = analysis.variants.find((v) => v.id === item.variantId);
      if (!variant) continue;

      store.updateBatchItem(item.variantId, { status: 'running', progress: 10 });

      try {
        const prompt = buildSeedancePrompt(store.productName, variant.full_script, 'everyday_person');
        store.updateBatchItem(item.variantId, { progress: 30 });

        const taskId = await client.generateUGCVideoSeedanceFast({ prompt, duration: 10 });
        store.updateBatchItem(item.variantId, { progress: 50 });

        const result = await client.pollUntilComplete(taskId, () => {
          store.updateBatchItem(item.variantId, { progress: 70 });
        });

        const videoUrl = result.videoUrl ? await client.getDownloadUrl(result.videoUrl) : '';
        store.updateBatchItem(item.variantId, { status: 'completed', progress: 100, videoUrl });
      } catch (err: any) {
        store.updateBatchItem(item.variantId, { status: 'failed', error: err.message });
      }

      // Small delay between generations
      await new Promise((r) => setTimeout(r, 2000));
    }

    store.setIsBatchRunning(false);
    toast.success('¡Batch completado!');
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={20} />;
      case 'running': return <Loader2 className="text-primary animate-spin" size={20} />;
      case 'failed': return <AlertTriangle className="text-destructive" size={20} />;
      default: return <Clock className="text-muted-foreground" size={20} />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/intelligence')}>
        <ArrowLeft size={16} className="mr-1" /> Volver a Intelligence
      </Button>

      <div>
        <h1 className="text-2xl font-heading font-bold">Variantes en Cola</h1>
        <p className="text-sm text-muted-foreground">{store.productName} — {batchItems.length} variantes</p>
      </div>

      {/* Global progress */}
      <div className="glass-card p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>{completedCount}/{batchItems.length} completadas</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-accent rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Start button */}
      {!isBatchRunning && completedCount === 0 && (
        <Button size="lg" className="gradient-accent w-full text-lg" onClick={startBatch}>
          <Play size={20} className="mr-2" /> Iniciar generación
        </Button>
      )}

      {/* Items */}
      <div className="space-y-3">
        {batchItems.map((item, i) => (
          <motion.div
            key={item.variantId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            {statusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Variante {item.variantId} ({item.style})</p>
              {item.status === 'running' && (
                <div className="mt-1.5">
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full gradient-accent rounded-full" animate={{ width: `${item.progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Generando... {item.progress}%</p>
                </div>
              )}
              {item.status === 'queued' && <p className="text-xs text-muted-foreground">En cola</p>}
              {item.status === 'failed' && <p className="text-xs text-destructive">{item.error}</p>}
            </div>
            {item.status === 'completed' && item.videoUrl && (
              <div className="flex gap-2 shrink-0">
                <a href={item.videoUrl} target="_blank" rel="noopener">
                  <Button size="sm" variant="outline"><ExternalLink size={14} /></Button>
                </a>
                <a href={item.videoUrl} download target="_blank" rel="noopener">
                  <Button size="sm" variant="outline"><Download size={14} /></Button>
                </a>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
