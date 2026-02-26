import type { MediaProvider, GenerationParams, GenerationResult, ProviderCapabilities } from '@/lib/types';

export class KlingImageToVideoProvider implements MediaProvider {
  id = 'kling-i2v';
  name = 'Kling Image-to-Video';
  capabilities: ProviderCapabilities = {
    formats: ['mp4'], webhooks: false,
    acceptsReferenceImage: true, acceptsReferenceVideo: false,
  };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    if (!params.referenceImageUrl) {
      return { success: false, error: { code: 'MISSING_INPUT', message: 'Reference image URL is required for image-to-video', retryable: false } };
    }
    const model = params.quality === 'preview' ? 'kling-video/v2/turbo/image-to-video' : 'kling-video/v2.5/pro/image-to-video';
    const duration = params.duration ?? 5;
    try {
      // Submit to fal.ai
      const res = await fetch('https://queue.fal.run/fal-ai/' + model, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Key ${process.env.FAL_KEY}` },
        body: JSON.stringify({
          prompt: params.prompt,
          image_url: params.referenceImageUrl,
          duration: String(duration),
          aspect_ratio: params.aspectRatio ?? '16:9',
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: { code: 'PROVIDER_ERROR', message: data.detail || 'Kling I2V error', retryable: res.status >= 500 } };
      // fal returns request_id for async polling
      return { success: true, externalJobId: data.request_id, format: 'mp4', costCents: Math.ceil(duration * (params.quality === 'preview' ? 5 : 10)) };
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
    } catch (e) { console.error("[KlingI2V] Poll failed:", e);
      return { status: 'processing' };
    }
  }
}
