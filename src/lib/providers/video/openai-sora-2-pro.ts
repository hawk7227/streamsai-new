import type { MediaProvider, ProviderCapabilities, ProviderLimits, GenerationParams, GenerationResult, ProviderStatusResult } from '@/lib/types';

export class OpenAISora2ProProvider implements MediaProvider {
  readonly name = 'openai-sora-2-pro';
  readonly toolType = 'video' as const;

  readonly capabilities: ProviderCapabilities = {
    preview: true, final: true, batchCount: 1, webhooks: true, streaming: false,
    nativeAudio: false, maxDuration: 30, maxResolution: '1080p',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedStyles: [],
  };

  readonly limits: ProviderLimits = { maxConcurrent: 3, requestsPerMinute: 10 };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const start = Date.now();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { success: false, error: { code: 'NO_API_KEY', message: 'OPENAI_API_KEY not set', retryable: false } };

    const resolution = params.quality === 'preview' ? '1280x720' : '1920x1080';
    const duration = params.duration ?? 8;

    try {
      const response = await fetch('https://api.openai.com/v1/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'sora-2-pro', prompt: params.prompt, size: resolution, seconds: duration }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errMsg = (err.error as Record<string, string>)?.message ?? `HTTP ${response.status}`;
        return { success: false, error: { code: `HTTP_${response.status}`, message: errMsg, retryable: response.status === 429 || response.status >= 500 } };
      }

      const data = await response.json() as { id: string };
      const costPerSec = resolution === '1280x720' ? 20 : 40;

      return { success: true, externalJobId: data.id, format: 'mp4', durationMs: Date.now() - start, costCents: costPerSec * duration, metadata: { model: 'sora-2-pro', resolution, duration } };
    } catch (err) {
      return { success: false, error: { code: 'NETWORK', message: err instanceof Error ? err.message : 'Unknown', retryable: true } };
    }
  }

  async pollStatus(externalJobId: string): Promise<ProviderStatusResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { status: 'failed', error: 'No API key' };

    try {
      const response = await fetch(`https://api.openai.com/v1/videos/${externalJobId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) return { status: 'failed', error: `HTTP ${response.status}` };

      const data = await response.json() as { status: string; progress?: number };
      if (data.status === 'completed') return { status: 'completed', progress: 100, resultUrl: `https://api.openai.com/v1/videos/${externalJobId}/content` };
      if (data.status === 'failed') return { status: 'failed', error: 'Generation failed' };
      return { status: 'processing', progress: data.progress ?? 50 };
    } catch { return { status: 'processing' }; }
  }

  async downloadResult(externalJobId: string): Promise<Buffer> {
    const apiKey = process.env.OPENAI_API_KEY!;
    const response = await fetch(`https://api.openai.com/v1/videos/${externalJobId}/content`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(300_000),
    });
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}
