import { create } from 'zustand';

export interface PipelineStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  error?: string;
  progress?: number;
}

interface UGCState {
  currentStep: number;
  productName: string;
  productImage: File | null;
  productImagePreview: string | null;
  keyBenefit: string;
  cta: string;
  productDescription: string;
  persona: string;
  videoStyle: string;
  hookType: string;
  script: string;
  pipelineMode: 'quick' | 'full';
  isRunning: boolean;
  pipelineSteps: PipelineStep[];
  resultClips: { label: string; url: string }[];
  error: string | null;

  setStep: (step: number) => void;
  setProductName: (name: string) => void;
  setProductImage: (file: File | null, preview: string | null) => void;
  setKeyBenefit: (benefit: string) => void;
  setCta: (cta: string) => void;
  setProductDescription: (desc: string) => void;
  setPersona: (persona: string) => void;
  setVideoStyle: (style: string) => void;
  setHookType: (hookType: string) => void;
  setScript: (script: string) => void;
  setPipelineMode: (mode: 'quick' | 'full') => void;
  setIsRunning: (running: boolean) => void;
  setPipelineSteps: (steps: PipelineStep[]) => void;
  updatePipelineStep: (id: string, update: Partial<PipelineStep>) => void;
  setResultClips: (clips: { label: string; url: string }[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  prefill: (data: Partial<Pick<UGCState, 'productName' | 'keyBenefit' | 'cta' | 'productDescription'>>) => void;
}

const initialState = {
  currentStep: 0,
  productName: '',
  productImage: null as File | null,
  productImagePreview: null as string | null,
  keyBenefit: '',
  cta: 'Agrégalo al carrito naranja',
  productDescription: '',
  persona: 'latam_woman_25_35',
  videoStyle: 'testimonial',
  hookType: 'question',
  script: '',
  pipelineMode: 'quick' as const,
  isRunning: false,
  pipelineSteps: [] as PipelineStep[],
  resultClips: [] as { label: string; url: string }[],
  error: null as string | null,
};

export const useUGCStore = create<UGCState>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setProductName: (productName) => set({ productName }),
  setProductImage: (productImage, productImagePreview) => set({ productImage, productImagePreview }),
  setKeyBenefit: (keyBenefit) => set({ keyBenefit }),
  setCta: (cta) => set({ cta }),
  setProductDescription: (productDescription) => set({ productDescription }),
  setPersona: (persona) => set({ persona }),
  setVideoStyle: (videoStyle) => set({ videoStyle }),
  setHookType: (hookType) => set({ hookType }),
  setScript: (script) => set({ script }),
  setPipelineMode: (pipelineMode) => set({ pipelineMode }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setPipelineSteps: (pipelineSteps) => set({ pipelineSteps }),
  updatePipelineStep: (id, update) =>
    set((state) => ({
      pipelineSteps: state.pipelineSteps.map((s) =>
        s.id === id ? { ...s, ...update } : s
      ),
    })),
  setResultClips: (resultClips) => set({ resultClips }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
  prefill: (data) => set({ ...data, currentStep: 0 }),
}));
