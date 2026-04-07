const BASE_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private headers(json = true) {
    const h: Record<string, string> = { 'xi-api-key': this.apiKey };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  async cloneVoice(name: string, audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('files', audioBlob, 'voice_sample.mp3');
    formData.append('description', `Cloned voice for UGCForge: ${name}`);

    const res = await fetch(`${BASE_URL}/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || `Clone failed: ${res.status}`);
    }

    const data = await res.json();
    return data.voice_id;
  }

  async generateVoiceover(voiceId: string, text: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || `TTS failed: ${res.status}`);
    }

    return res.blob();
  }

  async changeVoice(voiceId: string, audioBlob: Blob): Promise<Blob> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'input.mp3');
    formData.append('model_id', 'eleven_english_sts_v2');

    const res = await fetch(`${BASE_URL}/speech-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || `Voice change failed: ${res.status}`);
    }

    return res.blob();
  }

  async listVoices(): Promise<Array<{ voice_id: string; name: string; category: string }>> {
    const res = await fetch(`${BASE_URL}/voices`, { headers: this.headers(false) });
    if (!res.ok) throw new Error(`List voices failed: ${res.status}`);
    const data = await res.json();
    return data.voices || [];
  }

  async deleteVoice(voiceId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    if (!res.ok) throw new Error(`Delete voice failed: ${res.status}`);
  }

  static async extractAudioFromVideoUrl(url: string): Promise<Blob> {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch video');
    return res.blob();
  }
}
