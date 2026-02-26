import type { MediaProvider, GenerationParams, GenerationResult, ProviderCapabilities } from '@/lib/types';

export class ShotstackEditProvider implements MediaProvider {
  id = 'shotstack-edit';
  name = 'Shotstack Video Overlay/Edit';
  capabilities: ProviderCapabilities = {
    formats: ['mp4'], webhooks: true,
    acceptsReferenceVideo: true,
  };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    if (!params.referenceVideoUrl) {
      return { success: false, error: { code: 'MISSING_INPUT', message: 'Source video URL is required for editing/overlay', retryable: false } };
    }
    const overlay = params.overlayConfig ?? {};
    const resolution = params.quality === 'preview' ? 'preview' : 'hd';

    // Build Shotstack Edit JSON timeline
    const timeline = {
      background: '#000000',
      tracks: [
        // Overlay track (on top)
        ...(overlay.text ? [{
          clips: [{
            asset: { type: 'html', html: `<p style="font-family:Inter;font-size:32px;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.7)">${overlay.text}</p>`, width: 600, height: 80 },
            start: 0, length: 'end', position: overlay.textPosition ?? 'bottom',
          }],
        }] : []),
        // Main video track
        {
          clips: [{
            asset: { type: 'video', src: params.referenceVideoUrl },
            start: 0, length: 'auto',
          }],
        },
      ],
    };

    try {
      const res = await fetch('https://api.shotstack.io/edit/v1/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.SHOTSTACK_API_KEY!,
        },
        body: JSON.stringify({
          timeline,
          output: { format: 'mp4', resolution },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.response?.id) {
        return { success: false, error: { code: 'PROVIDER_ERROR', message: data.message || 'Shotstack render error', retryable: res.status >= 500 } };
      }
      return { success: true, externalJobId: data.response.id, format: 'mp4', costCents: params.quality === 'preview' ? 2 : 5 };
    } catch (e) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: (e as Error).message, retryable: true } };
    }
  }

  async pollStatus(externalJobId: string): Promise<import('@/lib/types').ProviderStatusResult> {
    try {
      const res = await fetch(`https://api.shotstack.io/edit/v1/render/${externalJobId}`, {
        headers: { 'x-api-key': process.env.SHOTSTACK_API_KEY! },
      });
      const data = await res.json();
      const s = data.response?.status;
      if (s === 'done') return { status: 'completed', resultUrl: data.response.url };
      if (s === 'failed') return { status: 'failed', error: 'Render failed' };
      return { status: 'processing', progress: s === 'rendering' ? 60 : 30 };
    } catch (e) { console.error('[Shotstack] Poll failed:', e); return { status: 'processing' }; }
  }
}
