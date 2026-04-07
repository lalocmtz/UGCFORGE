import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIntelligenceStore } from '@/store/intelligenceStore';
import { VideoIntelligenceEngine, VARIANT_STYLE_LABELS, type VariantStyle } from '@/lib/videoIntelligence';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Brain, FileText, Link, Loader2, Star, Shield, ChevronDown, ChevronUp, Film, Rocket, RefreshCw,
} from 'lucide-react';

const PLATFORM_LABELS: Record<string, string> = {
  tiktok_shop: 'TikTok Shop',
  facebook_ads: 'Meta Ads',
  instagram_reels: 'Instagram Reels',
};

function InputView() {
  const store = useIntelligenceStore();
  const [inputMode, setInputMode] = useState<'script' | 'url'>('script');

  const handleAnalyze = async () => {
    if (!store.productName.trim()) { toast.error('Ingresa el nombre del producto'); return; }
    const scriptText = inputMode === 'script' ? store.manualScript : '';
    if (inputMode === 'script' && !scriptText.trim()) { toast.error('Pega el script del video'); return; }
    if (inputMode === 'url' && !store.sourceUrl.trim()) { toast.error('Ingresa la URL del video'); return; }
    if (store.selectedStyles.length === 0) { toast.error('Selecciona al menos un estilo'); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Debes iniciar sesión'); return; }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('anthropic_key, rapidapi_key, assemblyai_key')
      .eq('id', user.id)
      .single();

    if (!settings?.anthropic_key) {
      toast.error('Configura tu Anthropic API key en Settings');
      return;
    }

    const engine = new VideoIntelligenceEngine(
      settings.anthropic_key,
      settings.rapidapi_key || undefined,
      settings.assemblyai_key || undefined
    );

    store.setIsAnalyzing(true);
    store.setError(null);

    try {
      let transcript = scriptText;
      let videoMeta = { plays: 0, likes: 0, shares: 0 };

      if (inputMode === 'url') {
        store.setAnalysisStep('Extrayendo video de TikTok...');
        const meta = await engine.extractTikTokVideo(store.sourceUrl);
        store.setVideoMeta(meta);
        videoMeta = { plays: meta.playCount, likes: meta.likeCount, shares: meta.shareCount };

        store.setAnalysisStep('Transcribiendo audio...');
        transcript = await engine.transcribeAudio(meta.audioUrl);
        store.setTranscript(transcript);
      }

      store.setAnalysisStep('Analizando script con IA...');
      const analysis = await engine.analyzeAndGenerateVariants({
        rawTranscript: transcript,
        productName: store.productName,
        productCategory: store.productCategory,
        videoMetrics: videoMeta,
        targetPlatform: store.targetPlatform,
        numVariants: store.numVariants,
        variantStyles: store.selectedStyles,
        complianceFilter: store.complianceFilter,
      });

      store.setAnalysis(analysis);

      // Save to DB
      await supabase.from('video_analyses').insert({
        user_id: user.id,
        source_url: inputMode === 'url' ? store.sourceUrl : null,
        raw_transcript: inputMode === 'url' ? transcript : null,
        manual_script: inputMode === 'script' ? scriptText : null,
        product_name: store.productName,
        product_category: store.productCategory,
        target_platform: store.targetPlatform,
        compliance_filter: store.complianceFilter,
        original_plays: videoMeta.plays,
        original_likes: videoMeta.likes,
        original_shares: videoMeta.shares,
        analysis_result: analysis as any,
        variants_count: analysis.variants.length,
      });
    } catch (err: any) {
      store.setError(err.message);
      toast.error(err.message);
    } finally {
      store.setIsAnalyzing(false);
      store.setAnalysisStep('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Input mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setInputMode('script')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'script' ? 'bg-primary/10 text-primary border border-primary/30' : 'glass-card hover:border-primary/20'
          }`}
        >
          <FileText size={16} /> Pegar script
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'url' ? 'bg-primary/10 text-primary border border-primary/30' : 'glass-card hover:border-primary/20'
          }`}
        >
          <Link size={16} /> URL del video
        </button>
      </div>

      {/* Input area */}
      {inputMode === 'script' ? (
        <Textarea
          placeholder="Pega aquí el script del video ganador..."
          value={store.manualScript}
          onChange={(e) => store.setManualScript(e.target.value)}
          rows={6}
          className="bg-muted border-border"
        />
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="https://www.tiktok.com/@user/video/..."
            value={store.sourceUrl}
            onChange={(e) => store.setSourceUrl(e.target.value)}
            className="bg-muted border-border"
          />
          <p className="text-xs text-muted-foreground">Requiere RapidAPI key + AssemblyAI key en Settings</p>
        </div>
      )}

      {/* Config */}
      <div className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Producto</label>
            <Input placeholder="Ej: Sérum de vitamina C" value={store.productName} onChange={(e) => store.setProductName(e.target.value)} className="bg-muted border-border" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Categoría</label>
            <Input placeholder="Ej: Skincare" value={store.productCategory} onChange={(e) => store.setProductCategory(e.target.value)} className="bg-muted border-border" />
          </div>
        </div>

        {/* Num variants */}
        <div>
          <label className="text-sm font-medium mb-2 block">Número de variantes</label>
          <div className="flex gap-2">
            {[1, 2, 3, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => store.setNumVariants(n)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                  store.numVariants === n ? 'gradient-accent text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Variant styles */}
        <div>
          <label className="text-sm font-medium mb-2 block">Estilos de variante</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(VARIANT_STYLE_LABELS) as [VariantStyle, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => store.toggleStyle(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  store.selectedStyles.includes(key)
                    ? 'bg-secondary/20 border-secondary text-secondary'
                    : 'bg-muted border-border text-muted-foreground hover:border-secondary/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <label className="text-sm font-medium mb-2 block">Plataforma destino</label>
          <div className="flex gap-2">
            {(Object.entries(PLATFORM_LABELS) as [string, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => store.setTargetPlatform(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  store.targetPlatform === key ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Compliance TikTok Shop</p>
            <p className="text-xs text-muted-foreground">Evita claims médicos/financieros</p>
          </div>
          <Switch checked={store.complianceFilter} onCheckedChange={store.setComplianceFilter} />
        </div>
      </div>

      {/* Analyze button */}
      <Button
        size="lg"
        className="gradient-accent w-full text-lg"
        onClick={handleAnalyze}
        disabled={store.isAnalyzing}
      >
        {store.isAnalyzing ? (
          <>
            <Loader2 className="animate-spin mr-2" size={20} />
            {store.analysisStep}
          </>
        ) : (
          <>
            <Brain size={20} className="mr-2" />
            Analizar y Generar Variantes
          </>
        )}
      </Button>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right">{value}/10</span>
    </div>
  );
}

function VariantCard({ variant, isRecommended, index }: {
  variant: any;
  isRecommended: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(isRecommended);
  const navigate = useNavigate();
  const store = useIntelligenceStore();

  const handleCreateVideo = () => {
    navigate('/new', {
      state: {
        prefilled: {
          script: variant.full_script,
          productName: store.productName,
          cta: variant.cta,
          source: 'intelligence',
          variantId: variant.id,
        },
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card p-5 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isRecommended && (
            <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              <Star size={12} /> Recomendada
            </span>
          )}
          <h4 className="font-heading font-semibold">Variante {variant.id} — {variant.style}</h4>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <p className="text-primary font-medium italic">"{variant.hook_3s}"</p>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{variant.full_script}</p>

            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{variant.word_count} palabras</span>
              <span>~{variant.estimated_duration_seconds}s</span>
            </div>

            {variant.compliance_notes && (
              <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-lg">
                <Shield size={14} className="shrink-0 mt-0.5" />
                {variant.compliance_notes}
              </div>
            )}

            <div className="space-y-2">
              <ScoreBar label="Venta" value={variant.scores.sales_aggressiveness} />
              <ScoreBar label="Autenticidad" value={variant.scores.authenticity} />
              <ScoreBar label="Engagement" value={variant.scores.estimated_engagement} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button variant="outline" size="sm" className="bg-primary/10 hover:bg-primary/20" onClick={handleCreateVideo}>
        <Film size={14} className="mr-1" /> Crear Video
      </Button>
    </motion.div>
  );
}

function ResultsView() {
  const store = useIntelligenceStore();
  const navigate = useNavigate();
  const analysis = store.analysis!;
  const sortedVariants = [...analysis.variants].sort(
    (a, b) => b.scores.estimated_engagement - a.scores.estimated_engagement
  );

  const handleBatchAll = () => {
    const items = analysis.variants.map((v) => ({
      variantId: v.id,
      style: v.style,
      status: 'queued' as const,
      progress: 0,
    }));
    store.setBatchItems(items);
    navigate('/intelligence/queue');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Original analysis */}
      <div className="glass-card p-6 space-y-3">
        <h3 className="font-heading font-semibold text-lg">Análisis del Video Original</h3>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Hook:</span> <span className="text-primary italic">"{analysis.original_analysis.hook}"</span></p>
          <p><span className="text-muted-foreground">Framework:</span> {analysis.original_analysis.persuasion_framework}</p>
          <p><span className="text-muted-foreground">Por qué funcionó:</span> {analysis.original_analysis.why_it_worked}</p>
          <p><span className="text-muted-foreground">Ritmo:</span> {analysis.original_analysis.rhythm_pattern}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {analysis.original_analysis.conversion_keywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{kw}</span>
            ))}
          </div>
          {analysis.original_analysis.compliance_issues_found.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
              <p className="text-yellow-400 text-xs font-medium mb-1">⚠️ Compliance Issues</p>
              <ul className="text-xs text-yellow-400/80 list-disc list-inside">
                {analysis.original_analysis.compliance_issues_found.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* A/B rec */}
      <div className="glass-card p-4 bg-secondary/5 border-secondary/20">
        <p className="text-sm"><span className="font-semibold text-secondary">💡 A/B Test:</span> {analysis.a_b_test_recommendation}</p>
      </div>

      {/* Variants */}
      <h3 className="font-heading font-semibold text-lg">Variantes Generadas</h3>
      <div className="space-y-4">
        {sortedVariants.map((variant, i) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            isRecommended={variant.id === analysis.recommended_variant}
            index={i}
          />
        ))}
      </div>

      {/* Bottom actions */}
      <Button size="lg" className="gradient-accent w-full text-lg" onClick={handleBatchAll}>
        <Rocket size={20} className="mr-2" /> Crear videos con TODAS las variantes
      </Button>
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={store.reset}>
        <RefreshCw size={16} className="mr-2" /> Nuevo análisis
      </Button>
    </motion.div>
  );
}

export default function IntelligencePage() {
  const { analysis } = useIntelligenceStore();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg gradient-accent">
          <Brain size={24} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Video Intelligence</h1>
          <p className="text-sm text-muted-foreground">Analiza videos ganadores y genera variantes optimizadas</p>
        </div>
      </div>

      {analysis ? <ResultsView /> : <InputView />}
    </motion.div>
  );
}
