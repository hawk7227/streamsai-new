import type { MediaProvider, GenerationParams, GenerationResult, ProviderCapabilities } from '@/lib/types';

export class KlingVideoToVideoProvider implements MediaProvider {
  id = 'kling-v2v';
  name = 'Kling Video-to-Video (O1)';
  capabilities: ProviderCapabilities = {
    formats: ['mp4'], webhooks: false,
    acceptsReferenceImage: false, acceptsReferenceVideo: true,
  };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    if (!params.referenceVideoUrl) {
      return { success: false, error: { code: 'MISSING_INPUT', message: 'Reference video URL is required for video-to-video', retryable: false } };
    }
    try {
      const res = await fetch('https://queue.fal.run/fal-ai/kling-video/o1/video-to-video/reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Key ${process.env.FAL_KEY}` },
        body: JSON.stringify({
          prompt: params.prompt,
          video_url: params.referenceVideoUrl,
          duration: String(params.duration ?? 5),
          aspect_ratio: params.aspectRatio ?? '16:9',
          cfg_scale: params.quality === 'preview' ? 0.3 : 0.5,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: { code: 'PROVIDER_ERROR', message: data.detail || 'Kling V2V error', retryable: res.status >= 500 } };
      return { success: true, externalJobId: data.request_id, format: 'mp4', costCents: Math.ceil((params.duration ?? 5) * (params.quality === 'preview' ? 8 : 15)) };
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
    } catch (e) { console.error('[KlingV2V] Poll failed:', e); return { status: 'processing' }; }
  }
}
