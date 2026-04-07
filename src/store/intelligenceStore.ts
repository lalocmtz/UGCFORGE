import { create } from 'zustand';
import type { VariantStyle, TikTokVideoMeta, ScriptAnalysis } from '@/lib/videoIntelligence';

export interface BatchItem {
  variantId: number;
  style: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
}

interface IntelligenceState {
  // Input
  sourceUrl: string;
  manualScript: string;
  productName: string;
  productCategory: string;
  targetPlatform: 'tiktok_shop' | 'facebook_ads' | 'instagram_reels';
  numVariants: number;
  selectedStyles: VariantStyle[];
  complianceFilter: boolean;

  // Process
  isAnalyzing: boolean;
  analysisStep: string;
  videoMeta: TikTokVideoMeta | null;
  transcript: string;

  // Results
  analysis: ScriptAnalysis | null;
  error: string | null;

  // Batch
  batchItems: BatchItem[];
  isBatchRunning: boolean;

  // Actions
  setSourceUrl: (url: string) => void;
  setManualScript: (script: string) => void;
  setProductName: (name: string) => void;
  setProductCategory: (cat: string) => void;
  setTargetPlatform: (p: 'tiktok_shop' | 'facebook_ads' | 'instagram_reels') => void;
  setNumVariants: (n: number) => void;
  toggleStyle: (style: VariantStyle) => void;
  setComplianceFilter: (v: boolean) => void;
  setIsAnalyzing: (v: boolean) => void;
  setAnalysisStep: (step: string) => void;
  setVideoMeta: (meta: TikTokVideoMeta | null) => void;
  setTranscript: (t: string) => void;
  setAnalysis: (a: ScriptAnalysis | null) => void;
  setError: (e: string | null) => void;
  setBatchItems: (items: BatchItem[]) => void;
  updateBatchItem: (variantId: number, update: Partial<BatchItem>) => void;
  setIsBatchRunning: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  sourceUrl: '',
  manualScript: '',
  productName: '',
  productCategory: '',
  targetPlatform: 'tiktok_shop' as const,
  numVariants: 3,
  selectedStyles: ['testimonial_honest', 'shock_hook', 'problem_agitate'] as VariantStyle[],
  complianceFilter: true,
  isAnalyzing: false,
  analysisStep: '',
  videoMeta: null as TikTokVideoMeta | null,
  transcript: '',
  analysis: null as ScriptAnalysis | null,
  error: null as string | null,
  batchItems: [] as BatchItem[],
  isBatchRunning: false,
};

export const useIntelligenceStore = create<IntelligenceState>((set) => ({
  ...initialState,
  setSourceUrl: (sourceUrl) => set({ sourceUrl }),
  setManualScript: (manualScript) => set({ manualScript }),
  setProductName: (productName) => set({ productName }),
  setProductCategory: (productCategory) => set({ productCategory }),
  setTargetPlatform: (targetPlatform) => set({ targetPlatform }),
  setNumVariants: (numVariants) => set({ numVariants }),
  toggleStyle: (style) =>
    set((state) => ({
      selectedStyles: state.selectedStyles.includes(style)
        ? state.selectedStyles.filter((s) => s !== style)
        : [...state.selectedStyles, style],
    })),
  setComplianceFilter: (complianceFilter) => set({ complianceFilter }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisStep: (analysisStep) => set({ analysisStep }),
  setVideoMeta: (videoMeta) => set({ videoMeta }),
  setTranscript: (transcript) => set({ transcript }),
  setAnalysis: (analysis) => set({ analysis }),
  setError: (error) => set({ error }),
  setBatchItems: (batchItems) => set({ batchItems }),
  updateBatchItem: (variantId, update) =>
    set((state) => ({
      batchItems: state.batchItems.map((item) =>
        item.variantId === variantId ? { ...item, ...update } : item
      ),
    })),
  setIsBatchRunning: (isBatchRunning) => set({ isBatchRunning }),
  reset: () => set(initialState),
}));
