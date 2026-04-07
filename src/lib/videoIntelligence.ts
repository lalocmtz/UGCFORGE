import { supabase } from '@/integrations/supabase/client';

export type VariantStyle =
  | 'testimonial_honest'
  | 'shock_hook'
  | 'problem_agitate'
  | 'social_proof'
  | 'curiosity_gap'
  | 'before_after'
  | 'tutorial_soft'
  | 'friend_recommendation';

export const VARIANT_STYLE_LABELS: Record<VariantStyle, string> = {
  testimonial_honest: 'Testimonial Honesto',
  shock_hook: 'Shock Hook',
  problem_agitate: 'Problema → Solución',
  social_proof: 'Prueba Social',
  curiosity_gap: 'Curiosidad',
  before_after: 'Antes / Después',
  tutorial_soft: 'Tutorial Soft',
  friend_recommendation: 'Recomendación de Amiga',
};

export interface TikTokVideoMeta {
  videoUrl: string;
  audioUrl: string;
  description: string;
  playCount: number;
  likeCount: number;
  shareCount: number;
  author: string;
  duration: number;
}

export interface ScriptAnalysis {
  original_analysis: {
    hook: string;
    persuasion_framework: string;
    conversion_keywords: string[];
    rhythm_pattern: string;
    why_it_worked: string;
    compliance_issues_found: string[];
  };
  variants: Array<{
    id: number;
    style: string;
    hook_3s: string;
    full_script: string;
    word_count: number;
    estimated_duration_seconds: number;
    cta: string;
    scores: {
      sales_aggressiveness: number;
      authenticity: number;
      estimated_engagement: number;
    };
    compliance_notes: string;
  }>;
  recommended_variant: number;
  a_b_test_recommendation: string;
}

export class VideoIntelligenceEngine {
  private rapidApiKey?: string;
  private assemblyAiKey?: string;

  constructor(rapidApiKey?: string, assemblyAiKey?: string) {
    this.rapidApiKey = rapidApiKey;
    this.assemblyAiKey = assemblyAiKey;
  }

  async extractTikTokVideo(url: string): Promise<TikTokVideoMeta> {
    if (!this.rapidApiKey) throw new Error('RapidAPI key no configurada');
    const response = await fetch(
      `https://tiktok-download-without-watermark.p.rapidapi.com/analysis?url=${encodeURIComponent(url)}&hd=1`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'tiktok-download-without-watermark.p.rapidapi.com',
        },
      }
    );
    const data = await response.json();
    return {
      videoUrl: data.data?.play || data.data?.hdplay || '',
      audioUrl: data.data?.music || '',
      description: data.data?.title || '',
      playCount: data.data?.play_count || 0,
      likeCount: data.data?.digg_count || 0,
      shareCount: data.data?.share_count || 0,
      author: data.data?.author?.nickname || '',
      duration: data.data?.duration || 0,
    };
  }

  async transcribeAudio(audioUrl: string): Promise<string> {
    if (!this.assemblyAiKey) throw new Error('AssemblyAI key no configurada');

    const uploadRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: this.assemblyAiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ audio_url: audioUrl, language_detection: true }),
    });
    const uploadData = await uploadRes.json();
    const transcriptId = uploadData.id;

    if (!transcriptId) {
      throw new Error('Failed to start transcription: ' + (uploadData.error || 'No transcript ID returned'));
    }

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: this.assemblyAiKey },
      });
      const pollData = await pollRes.json();
      if (pollData.status === 'completed') return pollData.text || '';
      if (pollData.status === 'error') throw new Error(pollData.error || 'Transcription failed');
    }
    throw new Error('Transcription timed out');
  }

  async analyzeAndGenerateVariants(params: {
    rawTranscript: string;
    productName: string;
    productCategory: string;
    videoMetrics: { plays: number; likes: number; shares: number };
    targetPlatform: 'tiktok_shop' | 'facebook_ads' | 'instagram_reels';
    numVariants: number;
    variantStyles: VariantStyle[];
    complianceFilter: boolean;
  }): Promise<ScriptAnalysis> {
    const systemPrompt = `Eres un experto en marketing de respuesta directa y UGC para e-commerce. 
Analizas scripts de videos virales de venta y generas variantes optimizadas.
SIEMPRE responde en JSON puro, sin markdown, sin backticks, sin explicaciones fuera del JSON.`;

    const userPrompt = `Analiza este script de un video viral y genera ${params.numVariants} variantes.

SCRIPT ORIGINAL:
"""
${params.rawTranscript}
"""

PRODUCTO: ${params.productName}
CATEGORÍA: ${params.productCategory}
PLATAFORMA: ${params.targetPlatform}
MÉTRICAS: ${params.videoMetrics.plays} plays, ${params.videoMetrics.likes} likes, ${params.videoMetrics.shares} shares
ESTILOS SOLICITADOS: ${params.variantStyles.join(', ')}
FILTRO COMPLIANCE: ${params.complianceFilter ? 'SÍ - evitar claims médicos, financieros o exagerados' : 'NO'}

Responde SOLO con este JSON:
{
  "original_analysis": {
    "hook": "los primeros 3 segundos del script",
    "persuasion_framework": "nombre del framework usado",
    "conversion_keywords": ["keyword1", "keyword2"],
    "rhythm_pattern": "descripción del ritmo/cadencia",
    "why_it_worked": "explicación de por qué funcionó",
    "compliance_issues_found": ["issue1"] 
  },
  "variants": [
    {
      "id": 1,
      "style": "estilo_variante",
      "hook_3s": "hook de 3 segundos",
      "full_script": "script completo de la variante",
      "word_count": 80,
      "estimated_duration_seconds": 30,
      "cta": "call to action",
      "scores": {
        "sales_aggressiveness": 7,
        "authenticity": 8,
        "estimated_engagement": 9
      },
      "compliance_notes": "notas de compliance si aplica"
    }
  ],
  "recommended_variant": 1,
  "a_b_test_recommendation": "recomendación de A/B test"
}`;

    // Call via Edge Function instead of direct Anthropic API
    const { data, error } = await supabase.functions.invoke('analyze-script', {
      body: {
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 4000,
      },
    });

    // supabase.functions.invoke wraps non-2xx as a generic error,
    // but the real message is in `data` (parsed JSON body) or `error.context`
    if (error) {
      // Try to extract the real error message from the response body
      const realMessage =
        (data as any)?.error ||
        (typeof error === 'object' && 'context' in error
          ? await (error as any).context?.json?.().catch(() => null)
          : null
        )?.error ||
        error.message ||
        'Error calling analyze-script function';
      throw new Error(realMessage);
    }

    const text = data?.content?.[0]?.text || '';

    try {
      return JSON.parse(text) as ScriptAnalysis;
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]) as ScriptAnalysis;
      throw new Error('No se pudo parsear la respuesta de IA');
    }
  }
}
