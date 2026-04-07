const BASE_URL = 'https://api.kie.ai';

export interface TaskResult {
  status: string;
  videoUrl?: string;
  imageUrls?: string[];
  raw?: any;
}

function extractVideoUrl(data: any): string | undefined {
  return data?.videos?.[0]?.url
    || data?.output?.video_url
    || data?.works?.[0]?.video?.url
    || data?.result?.videos?.[0]?.url;
}

function extractImageUrls(data: any): string[] {
  if (data?.images) return data.images.map((i: any) => i.url || i);
  if (data?.output?.images) return data.output.images.map((i: any) => i.url || i);
  if (data?.works) return data.works.map((w: any) => w.image?.url).filter(Boolean);
  return [];
}

export class KieAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getCredits(): Promise<number> {
    const res = await fetch(`${BASE_URL}/api/v1/chat/credit`, { headers: this.headers() });
    const json = await res.json();
    return json.data ?? 0;
  }

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/api/v1/file-upload/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: formData,
    });
    const json = await res.json();
    return json.data?.url || json.data;
  }

  async generateImageNanoBanana(params: {
    prompt: string;
    reference_image_url?: string;
    aspect_ratio?: string;
    num_images?: number;
    quality?: string;
  }) {
    const res = await fetch(`${BASE_URL}/api/v1/market/google/nanobanana2`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        prompt: params.prompt,
        reference_image_url: params.reference_image_url,
        aspect_ratio: params.aspect_ratio || '9:16',
        num_images: params.num_images || 3,
        quality: params.quality || 'hd',
      }),
    });
    const json = await res.json();
    return json.data?.task_id || json.data?.id;
  }

  async generateUGCVideoSeedance(params: {
    prompt: string;
    reference_image_url?: string;
    product_image_url?: string;
    image_url?: string;
    aspect_ratio?: string;
    duration?: number;
    enable_audio?: boolean;
  }) {
    const res = await fetch(`${BASE_URL}/api/v1/market/bytedance/seedance-2`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        prompt: params.prompt,
        reference_image_url: params.reference_image_url,
        product_image_url: params.product_image_url,
        image_url: params.image_url,
        aspect_ratio: params.aspect_ratio || '9:16',
        duration: params.duration || 15,
        enable_audio: params.enable_audio ?? true,
      }),
    });
    const json = await res.json();
    return json.data?.task_id || json.data?.id;
  }

  async generateUGCVideoSeedanceFast(params: {
    prompt: string;
    product_image_url?: string;
    aspect_ratio?: string;
    duration?: number;
  }) {
    const res = await fetch(`${BASE_URL}/api/v1/market/bytedance/seedance-2-fast`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        prompt: params.prompt,
        product_image_url: params.product_image_url,
        aspect_ratio: params.aspect_ratio || '9:16',
        duration: params.duration || 10,
      }),
    });
    const json = await res.json();
    return json.data?.task_id || json.data?.id;
  }

  async animateImageKling(params: {
    prompt: string;
    image_url: string;
    duration?: number;
    aspect_ratio?: string;
    mode?: string;
    cfg_scale?: number;
  }) {
    const res = await fetch(`${BASE_URL}/api/v1/market/kling/kling-3-0`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        prompt: params.prompt,
        image_url: params.image_url,
        duration: params.duration || 5,
        aspect_ratio: params.aspect_ratio || '9:16',
        mode: params.mode || 'std',
        cfg_scale: params.cfg_scale || 0.5,
      }),
    });
    const json = await res.json();
    return json.data?.task_id || json.data?.id;
  }

  async pollUntilComplete(
    taskId: string,
    onProgress?: (data: any) => void,
    maxAttempts = 120,
    intervalMs = 5000
  ): Promise<TaskResult> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(`${BASE_URL}/api/v1/market/task/${taskId}`, { headers: this.headers() });
      const json = await res.json();
      const data = json.data || json;
      const rawStatus = data.status ?? data.task_status ?? '';
      const status = typeof rawStatus === 'string'
        ? rawStatus.toLowerCase()
        : String(rawStatus).toLowerCase();

      if (onProgress) onProgress(data);

      if (['completed', 'succeed', 'success'].includes(status)) {
        return {
          status: 'completed',
          videoUrl: extractVideoUrl(data),
          imageUrls: extractImageUrls(data),
          raw: data,
        };
      }

      if (['failed', 'error', 'cancelled'].includes(status)) {
        throw new Error(data.error_message || data.message || `Task ${taskId} failed`);
      }

      await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error(`Task ${taskId} timed out`);
  }

  async getDownloadUrl(fileUrl: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/v1/common/download-url`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ url: fileUrl }),
    });
    const json = await res.json();
    return json.data?.url || json.data || fileUrl;
  }
}
