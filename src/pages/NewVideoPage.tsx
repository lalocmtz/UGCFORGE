import { useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useUGCStore } from '@/store/ugcStore';
import { generateScript, PERSONA_LABELS, VIDEO_STYLES, HOOK_TYPES } from '@/lib/promptEngine';
import { QUICK_STEPS, FULL_STEPS, runPipeline } from '@/lib/pipelineOrchestrator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, ArrowLeft, ArrowRight, Zap, Target, Check, Loader2, X, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const stepLabels = ['Producto', 'Persona & Estilo', 'Script', 'Generar'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {stepLabels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            i <= current ? 'gradient-accent text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          <span className={`hidden sm:inline text-sm ${i <= current ? 'text-foreground' : 'text-muted-foreground'}`}>
            {label}
          </span>
          {i < stepLabels.length - 1 && <div className="w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

function Step1Product() {
  const { productName, setProductName, productImage, productImagePreview, setProductImage, keyBenefit, setKeyBenefit, cta, setCta, productDescription, setProductDescription, setStep } = useUGCStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB'); return; }
    const url = URL.createObjectURL(file);
    setProductImage(file, url);
  }, [setProductImage]);

  const canNext = productImage && productName.trim() && keyBenefit.trim();

  return (
    <div className="space-y-6">
      <div
        className="glass-card p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-center"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {productImagePreview ? (
          <img src={productImagePreview} alt="Producto" className="max-h-48 mx-auto rounded-lg" />
        ) : (
          <div className="py-8">
            <Upload className="mx-auto text-muted-foreground mb-3" size={40} />
            <p className="text-muted-foreground">Arrastra una imagen o haz clic para subir</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — máx 10MB</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Input placeholder="Nombre del producto" value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-muted border-border" />
        <Input placeholder="Beneficio principal" value={keyBenefit} onChange={(e) => setKeyBenefit(e.target.value)} className="bg-muted border-border" />
        <Input placeholder="CTA" value={cta} onChange={(e) => setCta(e.target.value)} className="bg-muted border-border" />
        <Input placeholder="Descripción (opcional)" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="bg-muted border-border" />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setStep(1)} disabled={!canNext} className="gradient-accent">
          Siguiente <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}

function SelectGrid({ options, value, onChange, columns = 3 }: { options: Record<string, string>; value: string; onChange: (v: string) => void; columns?: number }) {
  return (
    <div className={`grid gap-3 grid-cols-2 sm:grid-cols-${columns}`}>
      {Object.entries(options).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`glass-card p-4 text-sm font-medium text-center transition-all ${
            value === key ? 'border-primary ring-1 ring-primary text-primary' : 'hover:border-primary/30'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Step2PersonaStyle() {
  const { persona, setPersona, videoStyle, setVideoStyle, hookType, setHookType, setStep } = useUGCStore();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-semibold mb-3">¿Quién presenta?</h3>
        <SelectGrid options={PERSONA_LABELS} value={persona} onChange={setPersona} />
      </div>
      <div>
        <h3 className="font-heading font-semibold mb-3">Estilo de video</h3>
        <SelectGrid options={VIDEO_STYLES} value={videoStyle} onChange={setVideoStyle} />
      </div>
      <div>
        <h3 className="font-heading font-semibold mb-3">Tipo de hook</h3>
        <SelectGrid options={HOOK_TYPES} value={hookType} onChange={setHookType} />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft size={16} className="mr-2" /> Atrás</Button>
        <Button onClick={() => {
          const store = useUGCStore.getState();
          const script = generateScript(store.productName, store.keyBenefit, store.cta, store.videoStyle, store.hookType, store.productDescription);
          store.setScript(script);
          store.setStep(2);
        }} className="gradient-accent">
          Siguiente <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}

function Step3Script() {
  const { script, setScript, setStep } = useUGCStore();
  const regenerate = () => {
    const s = useUGCStore.getState();
    setScript(generateScript(s.productName, s.keyBenefit, s.cta, s.videoStyle, s.hookType, s.productDescription));
  };
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold">Script generado</h3>
          <Button variant="ghost" size="sm" onClick={regenerate}><RefreshCw size={14} className="mr-1" /> Regenerar</Button>
        </div>
        <Textarea value={script} onChange={(e) => setScript(e.target.value)} rows={6} className="bg-muted border-border" />
        <p className="text-xs text-muted-foreground mt-1">{script.length} caracteres</p>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft size={16} className="mr-2" /> Atrás</Button>
        <Button onClick={() => setStep(3)} className="gradient-accent" disabled={!script.trim()}>
          Siguiente <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}

function Step4Generate() {
  const { pipelineMode, setPipelineMode, setStep, setIsRunning, setPipelineSteps, setResultClips, setError, updatePipelineStep } = useUGCStore();

  const handleGenerate = async () => {
    const state = useUGCStore.getState();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Debes iniciar sesión'); return; }

    // Get API key from user_settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('kie_api_key')
      .eq('id', user.id)
      .single();

    const apiKey = settings?.kie_api_key;
    if (!apiKey) {
      toast.error('Configura tu API key de kie.ai en Settings');
      return;
    }

    const steps = state.pipelineMode === 'quick' ? [...QUICK_STEPS] : [...FULL_STEPS];
    setPipelineSteps(steps);
    setIsRunning(true);
    setError(null);

    try {
      const clips = await runPipeline({
        productName: state.productName,
        productImage: state.productImage!,
        persona: state.persona,
        script: state.script,
        pipelineMode: state.pipelineMode,
        apiKey,
        onStepUpdate: updatePipelineStep,
      });
      setResultClips(clips);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-semibold">Modo de generación</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setPipelineMode('quick')}
          className={`glass-card p-6 text-left transition-all ${pipelineMode === 'quick' ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/30'}`}
        >
          <Zap className="text-primary mb-3" size={28} />
          <h4 className="font-heading font-semibold text-lg">Modo Quick</h4>
          <p className="text-sm text-muted-foreground mt-1">Un video UGC de 15s, listo en ~3 min</p>
        </button>
        <button
          onClick={() => setPipelineMode('full')}
          className={`glass-card p-6 text-left transition-all ${pipelineMode === 'full' ? 'border-secondary ring-1 ring-secondary' : 'hover:border-secondary/30'}`}
        >
          <Target className="text-secondary mb-3" size={28} />
          <h4 className="font-heading font-semibold text-lg">Modo Full Pipeline</h4>
          <p className="text-sm text-muted-foreground mt-1">Video apertura + 4 clips B-roll (~15 min)</p>
        </button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft size={16} className="mr-2" /> Atrás</Button>
        <Button size="lg" className="gradient-accent text-lg px-8" onClick={handleGenerate}>
          <Zap size={20} className="mr-2" />
          GENERAR VIDEO UGC
        </Button>
      </div>
    </div>
  );
}

function PipelineProgress() {
  const { pipelineSteps, isRunning, error, resultClips, reset } = useUGCStore();
  const completedCount = pipelineSteps.filter(s => s.status === 'completed').length;
  const progress = pipelineSteps.length ? Math.round((completedCount / pipelineSteps.length) * 100) : 0;

  if (resultClips.length > 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h2 className="text-2xl font-heading font-bold text-center">🎬 ¡Tus clips están listos!</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resultClips.map((clip, i) => (
            <div key={i} className="glass-card p-4">
              <video controls className="w-full rounded-lg aspect-[9/16] bg-muted" src={clip.url} />
              <p className="text-sm font-medium mt-2">{clip.label}</p>
              <a href={clip.url} download target="_blank" rel="noopener">
                <Button size="sm" variant="outline" className="mt-2 w-full">
                  <Download size={14} className="mr-1" /> Descargar
                </Button>
              </a>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground glass-card p-4">
          💡 En CapCut: importa todos los clips, el opening ya tiene voz, ajusta timing y exporta.
        </p>
        <Button onClick={reset} className="gradient-accent w-full">Crear otro video</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-xl font-heading font-bold">Generando tu video UGC...</h2>
      <div className="glass-card p-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span>Paso {completedCount}/{pipelineSteps.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full gradient-accent rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>

        <div className="space-y-3 mt-4">
          {pipelineSteps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              {step.status === 'pending' && <div className="w-5 h-5 rounded-full bg-muted" />}
              {step.status === 'active' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              {step.status === 'completed' && <Check className="w-5 h-5 text-green-500" />}
              {step.status === 'failed' && <X className="w-5 h-5 text-destructive" />}
              <span className={step.status === 'active' ? 'text-primary' : step.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}>
                {step.label}
              </span>
              {step.error && <span className="text-xs text-destructive ml-2">{step.error}</span>}
            </div>
          ))}
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <p className="text-sm text-muted-foreground text-center">Esto puede tomar varios minutos. No cierres esta ventana.</p>
    </motion.div>
  );
}

export default function NewVideoPage() {
  const { currentStep, isRunning, resultClips } = useUGCStore();

  if (isRunning || resultClips.length > 0) return <PipelineProgress />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-heading font-bold mb-2">Nuevo Video UGC</h1>
      <StepIndicator current={currentStep} />
      {currentStep === 0 && <Step1Product />}
      {currentStep === 1 && <Step2PersonaStyle />}
      {currentStep === 2 && <Step3Script />}
      {currentStep === 3 && <Step4Generate />}
    </motion.div>
  );
}
