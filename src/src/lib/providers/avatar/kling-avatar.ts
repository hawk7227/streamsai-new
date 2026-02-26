import type { MediaProvider, GenerationParams, GenerationResult, ProviderCapabilities } from '@/lib/types';

export class KlingAvatarProvider implements MediaProvider {
  id = 'kling-avatar';
  name = 'Kling Avatar v2 Pro';
  capabilities: ProviderCapabilities = {
    formats: ['mp4'], webhooks: false,
    acceptsReferenceImage: true, acceptsReferenceAudio: true,
  };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    if (!params.referenceImageUrl) {
      return { success: false, error: { code: 'MISSING_INPUT', message: 'Portrait image is required for avatar generation', retryable: false } };
    }
    if (!params.referenceAudioUrl) {
      return { success: false, error: { code: 'MISSING_INPUT', message: 'Audio file is required for avatar generation', retryable: false } };
    }
    const model = params.quality === 'preview' ? 'kling-video/ai-avatar/v2/standard' : 'kling-video/ai-avatar/v2/pro';
    try {
      const res = await fetch(`https://queue.fal.run/fal-ai/${model}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Key ${process.env.FAL_KEY}` },
        body: JSON.stringify({
          image_url: params.referenceImageUrl,
          audio_url: params.referenceAudioUrl,
          prompt: params.prompt || 'confident presenter, medium close-up, subtle gestures',
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: { code: 'PROVIDER_ERROR', message: data.detail || 'Kling Avatar error', retryable: res.status >= 500 } };
      return { success: true, externalJobId: data.request_id, format: 'mp4', costCents: Math.ceil((params.duration ?? 10) * (params.quality === 'preview' ? 5.6 : 11.5)) };
    } catch (e) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: (e as Error).message, retryable: true } };
    }
  }

  async pollStatus(externalJobId: string): Promise<import('@/lib/types').ProviderStatusResult> {
    try {
      const res = await fetch(`https://queue.fal.run/fal-ai/kling-video/requests/${externalJobId}/status`, {
        headers: { Authorization: `Key ${process.env.FAL_KEY}` },
      });
      const data = await res.json();
      if (data.status === 'COMPLETED') return { status: 'completed', resultUrl: data.response_url };
      if (data.status === 'FAILED') return { status: 'failed', error: data.error || 'Generation failed' };
      return { status: 'processing', progress: data.progress ?? 50 };
    } catch (e) { console.error('[KlingAvatar] Poll failed:', e); return { status: 'processing' }; }
  }
}
